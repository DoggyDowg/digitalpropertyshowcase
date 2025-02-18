import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PropertyClientWrapper } from './PropertyClientWrapper'
import { Metadata } from 'next'
import { getGalleryImages } from '@/utils/galleryUtils'

// Add a distinctive version log
console.log('🏠 DIGITAL PROPERTY SHOWCASE - BUILD VERSION 1.0.0 - ' + new Date().toISOString())
console.log('================================================')

type PageProps = { 
  params: { id: string }
}

// Metadata generation
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  console.log('=== PAGE METADATA GENERATOR ===')
  console.log('Property ID:', params.id)
  
  // Get property data using the same method as the page
  const supabase = createServerComponentClient({ cookies })
  const { data: property } = await supabase
    .from('properties')
    .select('*, agency_settings(*)')
    .eq('id', params.id)
    .single()

  console.log('Property Data for Metadata:', {
    id: property?.id,
    name: property?.name,
    content: property?.content
  })

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
  let baseUrl = property.custom_domain || 
                property.deployment_url || 
                process.env.NEXT_PUBLIC_BASE_URL || 
                'https://digipropshow.com'
  
  // Ensure baseUrl starts with https://
  if (!baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }

  // Ensure ogImage is an absolute URL
  if (ogImage && !ogImage.startsWith('http')) {
    ogImage = `${baseUrl}${ogImage}`
  }

  // Construct the property URL
  const propertyUrl = `${baseUrl}/properties/${params.id}`

  // Get the property title
  const propertyTitle = property.content?.seo?.title || `${property.name} - ${property.suburb}`
  const propertyDescription = property.content?.seo?.description || `Discover ${property.name} in ${property.suburb}. A stunning property showcased by ${agencyName}.`

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

  console.log('Generated Page Metadata:', metadata)
  return metadata
}

export default async function PropertyPage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Fetch property data on the server
  const { data: property, error } = await supabase
    .from('properties')
    .select('*, agency_settings(*)')
    .eq('id', params.id)
    .single()

  console.log('=== PROPERTY DATA ===')
  console.log('Property ID:', params.id)
  console.log('Property:', property)
  console.log('Property is_demo:', property?.is_demo)
  console.log('Property content:', property?.content)
  console.log('===================')

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <PropertyClientWrapper 
      property={property}
      template={property.template_name === 'dubai' ? 'dubai' : 'cusco'}
      propertyId={params.id}
    />
  )
}

