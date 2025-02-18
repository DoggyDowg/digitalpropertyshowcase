'use client'

import { use } from 'react'
import { useProperty } from '@/hooks/useProperty'
import { CuscoTemplate } from '@/templates/cusco/page'
import { DubaiTemplate } from '@/templates/dubai/page'
import { useEffect } from 'react'
import HydrationFix from '@/components/shared/HydrationFix'

// Add a distinctive version log
console.log('🏠 DIGITAL PROPERTY SHOWCASE - BUILD VERSION 1.0.0 - ' + new Date().toISOString())
console.log('================================================')

interface PropertyPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { id } = use(params)
  const { property, loading, error } = useProperty(id)

  // Set favicon dynamically based on property data
  useEffect(() => {
    console.log('PropertyPage: Favicon effect running', { property })
    // Find existing favicon links
    const links = document.querySelectorAll("link[rel*='icon']")
    
    // Remove any existing favicon links
    links.forEach(link => link.remove())
    
    // Create and add new favicon links if we have a favicon URL
    if (property?.agency_settings?.branding?.favicon) {
      // Add standard favicon
      const favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.href = property.agency_settings.branding.favicon
      document.head.appendChild(favicon)
      
      // Add apple touch icon
      const appleTouchIcon = document.createElement('link')
      appleTouchIcon.rel = 'apple-touch-icon'
      appleTouchIcon.href = property.agency_settings.branding.favicon
      document.head.appendChild(appleTouchIcon)
    }
  }, [property])

  console.log('PropertyPage: Rendering with state:', { loading, error, propertyId: property?.id })

  if (loading || !property) {
    return (
      <HydrationFix>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </HydrationFix>
    )
  }

  if (error) {
    return (
      <HydrationFix>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            <p className="mt-2 text-gray-600">{error.message}</p>
          </div>
        </div>
      </HydrationFix>
    )
  }

  // Render the appropriate template based on the property's template_name
  return (
    <HydrationFix>
      {property.template_name === 'dubai' ? (
        <DubaiTemplate propertyId={id} />
      ) : (
        <CuscoTemplate propertyId={id} />
      )}
    </HydrationFix>
  )
}