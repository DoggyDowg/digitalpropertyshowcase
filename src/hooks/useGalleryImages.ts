'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface GalleryImage {
  id: string
  src: string
  alt: string
}

const BATCH_SIZE = 8
const TOTAL_DEMO_IMAGES = 12
const SUPPORTED_FORMATS = ['webp', 'jpg'] // Reduced to most efficient formats

export function useGalleryImages(propertyId?: string, isDemoProperty?: boolean) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    async function loadImages() {
      if (!propertyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // If it's a demo property, generate demo gallery images
        if (isDemoProperty) {
          // Load images in batches
          for (let batch = 0; batch < Math.ceil(TOTAL_DEMO_IMAGES / BATCH_SIZE); batch++) {
            const batchPromises: Promise<GalleryImage | null>[] = []
            const startIdx = batch * BATCH_SIZE
            const endIdx = Math.min(startIdx + BATCH_SIZE, TOTAL_DEMO_IMAGES)

            // Process each image in the current batch
            for (let i = startIdx + 1; i <= endIdx; i++) {
              batchPromises.push((async () => {
                for (const format of SUPPORTED_FORMATS) {
                  const fileName = `Fleetwood 61-${i}.${format}`
                  const { data } = supabase.storage
                    .from('property-assets')
                    .getPublicUrl(`demo/gallery/${fileName}`)

                  try {
                    const response = await fetch(data.publicUrl, { 
                      method: 'HEAD',
                      signal: abortController.signal
                    })
                    if (response.ok) {
                      return {
                        id: `demo-gallery-${i}`,
                        src: data.publicUrl,
                        alt: `Gallery Image ${i}`
                      }
                    }
                  } catch (err: unknown) {
                    // Silently continue to next format
                  }
                }
                return null
              })())
            }

            // Wait for the current batch to complete
            const batchResults = await Promise.all(batchPromises)
            const validImages = batchResults.filter((img): img is GalleryImage => img !== null)
            
            if (isMounted) {
              setImages(prev => [...prev, ...validImages])
              // Only show loading state for first batch
              if (batch === 0) setLoading(false)
            }
          }
        } else {
          // For real properties, load in batches from the database
          const { data, error } = await supabase
            .from('assets')
            .select('id, storage_path')
            .eq('property_id', propertyId)
            .eq('category', 'gallery')
            .eq('status', 'active')

          if (error) throw error

          if (data) {
            // Process in batches
            for (let i = 0; i < data.length; i += BATCH_SIZE) {
              const batch = data.slice(i, i + BATCH_SIZE)
              const batchImages = await Promise.all(
                batch.map(async (asset) => {
                  const { data: publicUrlData } = supabase
                    .storage
                    .from('property-assets')
                    .getPublicUrl(asset.storage_path)

                  return {
                    id: asset.id,
                    src: publicUrlData.publicUrl,
                    alt: `Gallery Image`
                  }
                })
              )

              if (isMounted) {
                setImages(prev => [...prev, ...batchImages])
                // Only show loading state for first batch
                if (i === 0) setLoading(false)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading gallery images:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load gallery images'))
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