'use client'

import { useEffect } from 'react'
import type { Property } from '@/types/property'

interface BrandFontInitializerProps {
  property: Property
}

export function BrandFontInitializer({ property }: BrandFontInitializerProps) {
  useEffect(() => {
    console.log('BrandFontInitializer: Starting font initialization...');
    
    if (!property?.agency_settings?.branding?.typography) {
      console.warn('BrandFontInitializer: No typography data found in property', {
        hasAgencySettings: !!property?.agency_settings,
        hasBranding: !!property?.agency_settings?.branding,
        hasTypography: !!property?.agency_settings?.branding?.typography
      });
      return
    }

    const { bodyFont, headingFont } = property.agency_settings.branding.typography
    console.log('BrandFontInitializer: Typography data found', { 
      bodyFontUrl: bodyFont?.url, 
      headingFontUrl: headingFont?.url 
    });
    
    async function loadFonts() {
      try {
        console.log('BrandFontInitializer: Attempting to fetch fonts...');
        
        // Helper function to fetch with fallback
        async function fetchWithFallback(url, description) {
          try {
            // First attempt - direct fetch with CORS settings
            console.log(`BrandFontInitializer: Fetching ${description} from:`, url);
            const response = await fetch(url, {
              mode: 'cors', 
              credentials: 'omit',
              cache: 'no-cache'
            }).catch(err => {
              console.error(`BrandFontInitializer: ${description} direct fetch error:`, err);
              throw err;
            });
            
            if (response.ok) {
              console.log(`BrandFontInitializer: ${description} fetched successfully!`);
              return response;
            }
            
            throw new Error(`Failed to fetch ${description}: ${response.status} ${response.statusText}`);
          } catch (error) {
            // Add a timestamp to bypass caching
            const timestampedUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
            console.log(`BrandFontInitializer: Retrying ${description} with timestamp:`, timestampedUrl);
            
            try {
              // Second attempt with timestamp
              const response = await fetch(timestampedUrl, {
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
              });
              
              if (response.ok) {
                console.log(`BrandFontInitializer: ${description} fetched successfully on retry!`);
                return response;
              }
              
              throw new Error(`Failed to fetch ${description} on retry: ${response.status} ${response.statusText}`);
            } catch (retryError) {
              console.error(`BrandFontInitializer: ${description} retry fetch failed:`, retryError);
              throw retryError;
            }
          }
        }
        
        // Load body font with fallback
        const bodyFontResponse = await fetchWithFallback(bodyFont.url, 'body font');
        const bodyFontBlob = await bodyFontResponse.blob();
        const bodyFontUrl = URL.createObjectURL(bodyFontBlob);

        // Load heading font with fallback
        const headingFontResponse = await fetchWithFallback(headingFont.url, 'heading font');
        const headingFontBlob = await headingFontResponse.blob();
        const headingFontUrl = URL.createObjectURL(headingFontBlob);

        // Helper function to determine font format
        const getFontFormat = (url: string) => {
          if (url.endsWith('.woff2')) return 'woff2'
          if (url.endsWith('.woff')) return 'woff'
          if (url.endsWith('.ttf')) return 'truetype'
          if (url.endsWith('.otf')) return 'opentype'
          return 'truetype' // default
        }

        // Create style element with high priority
        const style = document.createElement('style')
        style.id = 'agency-branding-fonts'
        style.setAttribute('data-priority', 'highest')
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

          /* Apply with !important to override any conflicting styles */
          :root {
            --font-paragraph: 'Agency Body Font', system-ui, sans-serif !important;
            --font-heading: 'Agency Heading Font', system-ui, sans-serif !important;
          }
          
          /* Force font application to common elements */
          .font-sans, body {
            font-family: var(--font-paragraph) !important;
          }
          
          .font-heading, h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading) !important;
          }
        `

        console.log('BrandFontInitializer: Injecting font styles into document head...');
        document.head.appendChild(style)
        console.log('BrandFontInitializer: Fonts loaded and applied successfully!');

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
        console.error('BrandFontInitializer: Font loading failed with detailed error', { 
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          bodyFontUrl: bodyFont?.url,
          headingFontUrl: headingFont?.url
        });
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