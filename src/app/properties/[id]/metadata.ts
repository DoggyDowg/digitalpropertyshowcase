import { Metadata } from 'next'
import { getProperty } from '@/utils/propertyUtils'
import { getGalleryImages } from '@/utils/galleryUtils'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Initialize Supabase client
  const supabase = createServerComponentClient({ cookies })

  // Get property data
  const property = await getProperty(params.id)

  if (!property) {
    return {
      title: 'Property Not Found',
      description: 'The requested property could not be found.',
    }
  }

  const agencyName = property.agency_name || property.agency_settings?.copyright?.split('©')?.[1]?.trim() || ''
  
  // Get the footer image for OG image
  let ogImage = ''
  
  // First try to get the footer image
  const { data: footerAsset } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('property_id', params.id)
    .eq('category', 'footer')
    .eq('status', 'active')
    .single()

  if (footerAsset?.storage_path) {
    const { data: publicUrlData } = supabase
      .storage
      .from('property-assets')
      .getPublicUrl(footerAsset.storage_path)
    ogImage = publicUrlData.publicUrl
  }

  // If no footer image, fallback to first gallery image
  if (!ogImage) {
    const galleryImages = await getGalleryImages(params.id)
    ogImage = galleryImages?.[0]?.src || property.agency_settings?.branding?.logo?.dark || ''
  }

  // Get the base URL for this property
  // First try property's custom domain, then deployment URL, then fallback to env variable
  let baseUrl = property.custom_domain || 
                property.deployment_url || 
                process.env.NEXT_PUBLIC_BASE_URL || 
                'https://digipropshow.com'
                
  // Ensure baseUrl starts with https://
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`
  }

  // Construct the property URL
  const propertyUrl = `${baseUrl}/properties/${params.id}`

  // Get the property title
  const propertyTitle = property.content?.seo?.title || `${property.name} - ${property.suburb}`
  const propertyDescription = property.content?.seo?.description || `Discover ${property.name} in ${property.suburb}. A stunning property showcased by ${agencyName}.`

  // Ensure ogImage is an absolute URL
  if (ogImage && !ogImage.startsWith('http')) {
    ogImage = `${baseUrl}${ogImage}`
  }

  return {
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
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: propertyTitle,
        },
      ] : undefined,
    },
    
    twitter: {
      card: 'summary_large_image',
      title: property.content?.og?.title || propertyTitle,
      description: property.content?.og?.description || propertyDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    
    robots: {
      index: true,
      follow: true,
    },
    
    alternates: {
      canonical: propertyUrl,
    },
  }
} 