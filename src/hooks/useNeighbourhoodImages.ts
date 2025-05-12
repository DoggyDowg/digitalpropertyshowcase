'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface NeighbourhoodImage {
  id: string
  src: string
  alt: string
}

export function useNeighbourhoodImages(propertyId?: string, isDemoProperty?: boolean) {
  const [images, setImages] = useState<NeighbourhoodImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadImages() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // If it's a demo property, generate demo neighbourhood images
        if (isDemoProperty) {
          // console.log('Loading demo neighbourhood images'); // Commented out
          const supportedFormats = ['webp', 'jpg', 'jpeg', 'png']
          const demoImages: NeighbourhoodImage[] = []

          for (let i = 1; i <= 3; i++) {
            let foundImage = false
            
            for (const format of supportedFormats) {
              const { data } = supabase.storage
                .from('property-assets')
                .getPublicUrl(`demo/neighbourhood/image${i}.${format}`)

              // Verify if the image exists
              try {
                const response = await fetch(data.publicUrl, { method: 'HEAD' })
                if (response.ok) {
                  // console.log(`Found demo neighbourhood image ${i} in ${format} format`); // Commented out
                  demoImages.push({
                    id: `demo-neighbourhood-${i}`,
                    src: data.publicUrl,
                    alt: `Neighbourhood Image ${i}`
                  })
                  foundImage = true
                  break
                }
              } catch {
                // console.log(`No ${format} format found for demo neighbourhood image ${i}`); // Commented out
              }
            }

            if (!foundImage) {
              console.error(`No supported image format found for demo neighbourhood image ${i}`)
            }
          }

          // console.log('Demo neighbourhood images:', demoImages); // Commented out
          setImages(demoImages)
          return
        }

        // Otherwise, query the assets table for a real property
        // console.log('Fetching neighbourhood images for property:', propertyId)
        const { data, error } = await supabase
          .from('assets')
          .select('id, storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'neighbourhood')
          .eq('status', 'active')

        if (error) throw error

        if (data) {
          const neighbourhoodImages = await Promise.all(
            data.map(async (asset) => {
              const { data: publicUrlData } = supabase
                .storage
                .from('property-assets')
                .getPublicUrl(asset.storage_path)

              return {
                id: asset.id,
                src: publicUrlData.publicUrl,
                alt: `Neighbourhood Image`
              }
            })
          )

          // console.log('Neighbourhood images:', neighbourhoodImages) // Commented out log
          setImages(neighbourhoodImages)
        }
      } catch (err) {
        console.error('Error loading neighbourhood images:', err)
        setError(err instanceof Error ? err : new Error('Failed to load neighbourhood images'))
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [supabase, propertyId, isDemoProperty])

  return { images, loading, error }
} 