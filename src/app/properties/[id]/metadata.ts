import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getGalleryImages } from '@/utils/galleryUtils'

async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

async function getOptimizedImageUrl(originalUrl: string): Promise<string> {
  // If it's an OG image, return as is since it's already optimized
  if (originalUrl.includes('/og_image/')) {
    return originalUrl;
  }
  
  // For other images from Supabase storage, add transformation parameters
  if (originalUrl.includes('supabase.co/storage/v1/object/public')) {
    const transformParams = new URLSearchParams({
      width: '1200',
      height: '630',
      quality: '75',
      format: 'jpg',
      fit: 'cover'
    }).toString();
    
    // Remove any existing query parameters and add our new ones
    const baseUrl = originalUrl.split('?')[0];
    return `${baseUrl}?${transformParams}`;
  }
  return originalUrl;
}

// Metadata generation
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  // Server-side logging with distinctive markers
  console.info('\n🔍 [Server] METADATA GENERATION STARTED 🔍')
  console.info('==========================================')
  
  const { id } = await params
  console.info(`[Server] Processing metadata for property ID: ${id}`)
  
  const supabase = createServerComponentClient({ cookies })
  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      agency_settings:agency_id (
        id,
        branding,
        footer_links,
        copyright,
        menu_items,
        office_addresses
      )
    `)
    .eq('id', id)
    .single()

  // Debug logging for agency settings data
  console.info('[Server] Agency Settings Debug:', {
    hasAgencySettings: !!property?.agency_settings,
    agencyId: property?.agency_id,
    footerLinksCount: property?.agency_settings?.footer_links?.length || 0,
    footerLinksData: property?.agency_settings?.footer_links
  })

  // Add cache busting timestamp and cache control headers
  const timestamp = Date.now()

  console.info('[Server] 🔄 Cache Debug:', {
    timestamp,
    hasAgencySettings: !!property?.agency_settings,
    footerLinksCount: property?.agency_settings?.footer_links?.length || 0
  })

  // Log property data with server marker
  console.info('[Server] 📝 Property Data:', {
    id: property?.id,
    name: property?.name,
    hasContent: !!property?.content,
    hasAgencySettings: !!property?.agency_settings
  })

  if (!property) {
    console.warn('[Server] ❌ No property found for ID:', id)
    return {
      title: 'Property Not Found',
      description: 'The requested property could not be found.',
    }
  }

  const agencyName = property.agency_name || property.agency_settings?.copyright?.split('©')?.[1]?.trim() || ''
  
  // Get the base URL for this property first
  let baseUrl = property.custom_domain || 
                property.deployment_url || 
                process.env.NEXT_PUBLIC_BASE_URL || 
                'https://digipropshow.com'
  
  console.info('[Server] Using base URL:', baseUrl)
  
  // Ensure baseUrl starts with https://
  if (!baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }

  // Debug favicon URL construction
  const faviconUrl = property.agency_settings?.branding?.favicon
  // Add cache busting timestamp to favicon URL
  const faviconUrlWithCache = faviconUrl ? `${faviconUrl}?t=${Date.now()}` : undefined
  console.info('[Server] 🎨 Favicon Debug:', {
    originalFaviconUrl: faviconUrl,
    faviconUrlWithCache,
    isAbsoluteUrl: faviconUrl?.startsWith('http'),
    baseUrl
  })

  // Initialize image variables
  let ogImage = ''
  const imageWidth = 1200
  const imageHeight = 630
  
  // First try to get the dedicated OG image
  try {
    console.info('[Server] 🖼️ Attempting to fetch OG image...')
    const { data: ogAsset } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('property_id', id)
      .eq('category', 'og_image')
      .eq('status', 'active')
      .single()

    if (ogAsset?.storage_path) {
      const { data: publicUrlData } = supabase
        .storage
        .from('property-assets')
        .getPublicUrl(ogAsset.storage_path)
      
      const imageUrl = await getOptimizedImageUrl(publicUrlData.publicUrl)
      if (await verifyImageUrl(imageUrl)) {
        ogImage = imageUrl
        console.info('[Server] Found and using optimized OG image:', ogImage)
      }
    }
  } catch (error) {
    console.error('[Server] Error fetching OG image:', error)
  }

  // If no OG image, try footer image
  if (!ogImage) {
    try {
      console.info('[Server] 🖼️ Falling back to footer image...')
      const { data: footerAsset } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('property_id', id)
        .eq('category', 'footer')
        .eq('status', 'active')
        .single()

      if (footerAsset?.storage_path) {
        const { data: publicUrlData } = supabase
          .storage
          .from('property-assets')
          .getPublicUrl(footerAsset.storage_path)
        
        const imageUrl = await getOptimizedImageUrl(publicUrlData.publicUrl)
        if (await verifyImageUrl(imageUrl)) {
          ogImage = imageUrl
          console.info('[Server] Using optimized footer image as fallback:', ogImage)
        }
      }
    } catch (error) {
      console.error('[Server] Error fetching footer image:', error)
    }
  }

  // If still no image, try gallery images
  if (!ogImage) {
    try {
      console.info('[Server] 🖼️ Falling back to gallery images...')
      const galleryImages = await getGalleryImages(id)
      if (galleryImages?.[0]?.src) {
        const imageUrl = galleryImages[0].src
        // Ensure gallery image URL is absolute
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
        const optimizedUrl = await getOptimizedImageUrl(fullImageUrl)
        if (await verifyImageUrl(optimizedUrl)) {
          ogImage = optimizedUrl
          console.info('[Server] Using optimized gallery image as fallback:', ogImage)
        }
      }
    } catch (error) {
      console.error('[Server] Error fetching gallery images:', error)
    }
  }

  // Final fallback to agency logo
  if (!ogImage && property.agency_settings?.branding?.logo?.dark) {
    const logoUrl = property.agency_settings.branding.logo.dark
    // Ensure logo URL is absolute
    const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`
    const optimizedUrl = await getOptimizedImageUrl(fullLogoUrl)
    if (await verifyImageUrl(optimizedUrl)) {
      ogImage = optimizedUrl
      console.info('[Server] Using optimized agency logo as final fallback:', ogImage)
    }
  }

  // Ensure final ogImage is an absolute URL and exists
  if (ogImage && !ogImage.startsWith('http')) {
    ogImage = `${baseUrl}${ogImage}`
  }

  // Construct the property URL
  const propertyUrl = `${baseUrl}/properties/${id}`

  // Get the property title
  const propertyTitle = property.content?.seo?.title || `${property.name} - ${property.suburb}`
  const propertyDescription = property.content?.seo?.description || `Discover ${property.name} in ${property.suburb}. A stunning property showcased by ${agencyName}.`

  // Prepare the image object with more specific type handling
  const imageObject = ogImage ? {
    url: ogImage,
    secureUrl: ogImage,
    width: imageWidth,
    height: imageHeight,
    alt: propertyTitle,
    type: 'image/jpeg', // Default to JPEG as most property images will be this format
  } : null

  const metadata: Metadata = {
    title: propertyTitle,
    description: propertyDescription,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: property.content?.og?.title || propertyTitle,
      description: property.content?.og?.description || propertyDescription,
      url: propertyUrl,
      siteName: agencyName,
      locale: 'en_AU',
      type: 'website',
      images: imageObject ? [imageObject] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: property.content?.og?.title || propertyTitle,
      description: property.content?.og?.description || propertyDescription,
      site: '@colellaproperty',
      creator: '@colellaproperty',
      images: imageObject ? [imageObject] : undefined,
    },
    icons: property.agency_settings?.branding?.favicon ? {
      icon: faviconUrlWithCache,
      shortcut: faviconUrlWithCache,
      apple: faviconUrlWithCache,
    } : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: propertyUrl,
    },
  }

  // Log the final metadata for debugging
  console.info('[Server] 📊 Final metadata:', {
    title: metadata.title,
    description: metadata.description,
    ogImage: metadata.openGraph?.images,
    twitterImage: metadata.twitter?.images,
    baseUrl: metadata.metadataBase?.toString(),
  })
  console.info('[Server] ✅ METADATA GENERATION COMPLETED ✅\n')

  return metadata
} 