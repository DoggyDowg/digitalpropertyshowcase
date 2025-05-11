'use client'

import { useEffect } from 'react'
import type { Property } from '@/types/property'

interface BrandFontInitializerProps {
  property: Property
}

export function BrandFontInitializer({ property }: BrandFontInitializerProps) {
  useEffect(() => {
    if (!property?.agency_settings?.branding?.typography) {
      return
    }

    const { bodyFont, headingFont } = property.agency_settings.branding.typography
    
    async function loadFonts() {
      try {
        // Load body font
        const bodyFontResponse = await fetch(bodyFont.url)
        if (!bodyFontResponse.ok) {
          console.error(`Failed to fetch body font: ${bodyFontResponse.status} ${bodyFontResponse.statusText}`)
          throw new Error(`Failed to fetch body font: ${bodyFontResponse.status} ${bodyFontResponse.statusText}`)
        }
        const bodyFontBlob = await bodyFontResponse.blob()
        const bodyFontUrl = URL.createObjectURL(bodyFontBlob)

        // Load heading font
        const headingFontResponse = await fetch(headingFont.url)
        if (!headingFontResponse.ok) {
          console.error(`Failed to fetch heading font: ${headingFontResponse.status} ${headingFontResponse.statusText}`)
          throw new Error(`Failed to fetch heading font: ${headingFontResponse.status} ${headingFontResponse.statusText}`)
        }
        const headingFontBlob = await headingFontResponse.blob()
        const headingFontUrl = URL.createObjectURL(headingFontBlob)

        // Helper function to determine font format
        const getFontFormat = (url: string) => {
          if (url.endsWith('.woff2')) return 'woff2'
          if (url.endsWith('.woff')) return 'woff'
          if (url.endsWith('.ttf')) return 'truetype'
          if (url.endsWith('.otf')) return 'opentype'
          return 'truetype' // default
        }

        // Create style element
        const style = document.createElement('style')
        style.textContent = `
          @font-face {
            font-family: 'Agency Body Font';
            src: url('${bodyFontUrl}') format('${getFontFormat(bodyFont.url)}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'Agency Heading Font';
            src: url('${headingFontUrl}') format('${getFontFormat(headingFont.url)}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }

          :root {
            --font-paragraph: 'Agency Body Font', system-ui, sans-serif;
            --font-heading: 'Agency Heading Font', system-ui, sans-serif;
          }
        `

        document.head.appendChild(style)

        // console.log('Fonts loaded successfully:', {
        //   bodyFont: bodyFont.url,
        //   headingFont: headingFont.url,
        //   bodyFormat: getFontFormat(bodyFont.url),
        //   headingFormat: getFontFormat(headingFont.url)
        // })

        return () => {
          if (document.head.contains(style)) {
            document.head.removeChild(style)
          }
          URL.revokeObjectURL(bodyFontUrl)
          URL.revokeObjectURL(headingFontUrl)
        }
      } catch (error) {
        console.error('Error loading fonts:', error)
        return () => {}
      }
    }

    let cleanupPromise = loadFonts()
    
    return () => {
      cleanupPromise.then(cleanupFn => {
        try {
          cleanupFn?.()
        } catch (e) {
          console.error('Error during font cleanup:', e)
        }
      }).catch(err => {
        console.error('Error resolving font cleanup function:', err)
      })
    }
  }, [property?.agency_settings?.branding?.typography])

  return null
} 