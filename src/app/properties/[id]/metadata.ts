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
  // If it's a Supabase storage URL, add transformation parameters
  if (originalUrl.includes('supabase.co/storage/v1/object/public')) {
    // Add width and quality parameters to reduce file size
    const transformParams = '?width=1200&quality=80'
    return `${originalUrl}${transformParams}`
  }
  return originalUrl
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
    .select('*, agency_settings(*)')
    .eq('id', id)
    .single()

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

  // Initialize image variables
  let ogImage = ''
  const imageWidth = 1200
  const imageHeight = 630
  
  // First try to get the footer image
  try {
    console.info('[Server] 🖼️ Attempting to fetch footer image...')
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
        console.info('[Server] Found and optimized footer image:', ogImage)
      }
    }
  } catch (error) {
    console.error('[Server] Error fetching footer image:', error)
  }

  // If no footer image, try gallery images
  if (!ogImage) {
    try {
      console.info('[Server] 🖼️ Attempting to fetch gallery images...')
      const galleryImages = await getGalleryImages(id)
      if (galleryImages?.[0]?.src) {
        const imageUrl = galleryImages[0].src
        // Ensure gallery image URL is absolute
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
        const optimizedUrl = await getOptimizedImageUrl(fullImageUrl)
        if (await verifyImageUrl(optimizedUrl)) {
          ogImage = optimizedUrl
          console.info('[Server] Using optimized gallery image:', ogImage)
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
      console.info('[Server] Using optimized agency logo:', ogImage)
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
      appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    },
    twitter: {
      card: 'summary_large_image',
      title: property.content?.og?.title || propertyTitle,
      description: property.content?.og?.description || propertyDescription,
      site: '@colellaproperty',
      creator: '@colellaproperty',
      images: imageObject ? [imageObject] : undefined,
    },
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
    fbAppId: metadata.openGraph?.appId || 'Not set'
  })
  console.info('[Server] ✅ METADATA GENERATION COMPLETED ✅\n')

  return metadata
} 