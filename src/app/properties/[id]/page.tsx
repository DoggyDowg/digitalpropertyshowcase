import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PropertyClientWrapper } from './PropertyClientWrapper'
import { generateMetadata } from './metadata'

export { generateMetadata }

// Add cache control headers
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PropertyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  console.info('\n🏠 [Server] PROPERTY PAGE RENDER STARTED 🏠')
  console.info('==========================================')
  
  const { id } = await params
  console.info(`[Server] Rendering property page for ID: ${id}`)
  
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: property, error } = await supabase
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
      ),
      assets!property_id(*)
    `)
    .eq('id', id)
    .single()

  // Add detailed debug logging
  console.info('[Server] Property Data Debug:', {
    id: property?.id,
    name: property?.name,
    hasAgencySettings: !!property?.agency_settings,
    agencySettingsId: property?.agency_id,
    footerLinksCount: property?.agency_settings?.footer_links?.length || 0,
    footerLinksData: property?.agency_settings?.footer_links,
    error: error?.message
  })

  console.info('[Server] Property Data:', {
    id: property?.id,
    name: property?.name,
    hasContent: !!property?.content,
    hasAgencySettings: !!property?.agency_settings,
    hasAssets: !!property?.assets,
    assetsCount: property?.assets?.length,
    error: error?.message
  })

  if (error) {
    console.error('[Server] ❌ Error fetching property:', error.message)
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
    console.warn('[Server] ⚠️ No property found for ID:', id)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  console.info('[Server] ✅ PROPERTY PAGE RENDER COMPLETED ✅\n')
  return (
    <PropertyClientWrapper 
      property={property}
      template={property.template_name === 'dubai' ? 'dubai' : 'cusco'}
    />
  )
}

