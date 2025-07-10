'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

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

        // Check if it's a demo property using centralized logic
        const isDemo = DEMO_CONFIG.isDemoProperty(propertyId, isDemoProperty)

        if (isDemo) {
          // Load demo neighbourhood images using centralized paths
          const demoImages: NeighbourhoodImage[] = []

          for (let i = 0; i < DEMO_CONFIG.assets.neighbourhood.length; i++) {
            const imagePath = DEMO_CONFIG.assets.neighbourhood[i]
            const imageUrl = await getDemoAssetUrl(supabase, imagePath)
            
            if (imageUrl) {
                  demoImages.push({
                id: `demo-neighbourhood-${i + 1}`,
                src: imageUrl,
                alt: `Neighbourhood Image ${i + 1}`
              })
            }
          }

          setImages(demoImages)
          setLoading(false)
          return
        }

        // For regular properties, query the database
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
  }, [propertyId, isDemoProperty, supabase])

  return { images, loading, error }
} 