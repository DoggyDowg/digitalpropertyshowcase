import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PropertyClientWrapper } from './PropertyClientWrapper'
import { generateMetadata } from './metadata'

export { generateMetadata }

export default async function PropertyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Fetch property data on the server
  const { data: property, error } = await supabase
    .from('properties')
    .select('*, agency_settings(*)')
    .eq('id', id)
    .single()

  console.log('=== PROPERTY DATA ===')
  console.log('Property ID:', id)
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
      propertyId={id}
    />
  )
}

