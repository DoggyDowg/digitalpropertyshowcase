'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AerialImage {
  id: string;
  src: string;
  alt: string;
}

export function useAerialImages(propertyId?: string, isDemoProperty?: boolean) {
  const [images, setImages] = useState<AerialImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    async function loadImages() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // If it's a demo property, use demo images
        if (isDemoProperty) {
          console.log('Loading demo aerial images')
          const supportedFormats = ['webp', 'jpg']
          const demoImages: AerialImage[] = []

          for (let i = 1; i <= 3; i++) {
            for (const format of supportedFormats) {
              const { data: publicUrlData } = supabase
                .storage
                .from('property-assets')
                .getPublicUrl(`demo/aerials/image${i}.${format}`)

              try {
                const response = await fetch(publicUrlData.publicUrl, { 
                  method: 'HEAD',
                  signal: abortController.signal
                })
                if (response.ok) {
                  console.log(`Found demo aerial image ${i} in ${format} format`)
                  demoImages.push({
                    id: `demo-aerial-${i}`,
                    src: publicUrlData.publicUrl,
                    alt: `Aerial View ${i}`
                  })
                  break
                }
              } catch (err) {
                console.log(`No ${format} format found for demo aerial image ${i}:`, err)
              }
            }
          }

          if (isMounted) {
            setImages(demoImages)
            setLoading(false)
          }
          return
        }

        // Query the assets table for aerial images
        // console.log('Fetching aerial images for property:', propertyId)
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('property_id', propertyId)
          .eq('category', 'aerials')
          .eq('status', 'active')
          .order('display_order', { ascending: true })

        if (error) throw error

        if (data) {
          const processedImages = data.map(asset => {
            const { data: publicUrlData } = supabase
              .storage
              .from('property-assets')
              .getPublicUrl(asset.storage_path)

            return {
              id: asset.id,
              src: publicUrlData.publicUrl,
              alt: asset.alt_text || asset.title || 'Aerial View'
            }
          })

          if (isMounted) {
            setImages(processedImages)
          }
        }
      } catch (err) {
        console.error('Error loading aerial images:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load aerial images'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadImages()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [supabase, propertyId, isDemoProperty])

  return { images, loading, error }
} 