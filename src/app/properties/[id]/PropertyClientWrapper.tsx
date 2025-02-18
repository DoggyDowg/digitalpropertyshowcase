'use client'

import { useEffect } from 'react'
import { CuscoTemplate } from '@/templates/cusco/page'
import { DubaiTemplate } from '@/templates/dubai/page'
import type { Property } from '@/types/property'

interface PropertyClientWrapperProps {
  property: Property
  template: 'dubai' | 'cusco'
  propertyId: string
}

export function PropertyClientWrapper({ property, template, propertyId }: PropertyClientWrapperProps) {
  // Handle favicon updates
  useEffect(() => {
    if (typeof document === 'undefined') return

    const updateFavicon = () => {
      const faviconUrl = property?.agency_settings?.branding?.favicon
      if (!faviconUrl) return

      // Update favicon
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = faviconUrl

      // Update apple touch icon
      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
      if (!appleLink) {
        appleLink = document.createElement('link')
        appleLink.rel = 'apple-touch-icon'
        document.head.appendChild(appleLink)
      }
      appleLink.href = faviconUrl
    }

    updateFavicon()

    return () => {
      // Cleanup not needed as we're just updating href values
    }
  }, [property])

  return template === 'dubai' ? (
    <DubaiTemplate propertyId={propertyId} />
  ) : (
    <CuscoTemplate propertyId={propertyId} />
  )
} 