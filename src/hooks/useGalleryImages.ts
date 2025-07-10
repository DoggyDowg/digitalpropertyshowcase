'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

interface GalleryImage {
  id: string
  src: string
  alt: string
}

const BATCH_SIZE = 8

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

        // Check if it's a demo property using centralized logic
        const isDemo = DEMO_CONFIG.isDemoProperty(propertyId, isDemoProperty)

        if (isDemo) {
          // Load demo gallery images using centralized paths
          const demoImages: GalleryImage[] = []
          
          for (let i = 0; i < DEMO_CONFIG.assets.gallery.length; i++) {
            const imagePath = DEMO_CONFIG.assets.gallery[i]
            const imageUrl = await getDemoAssetUrl(supabase, imagePath)
            
            if (imageUrl && isMounted) {
              demoImages.push({
                id: `demo-gallery-${i + 1}`,
                src: imageUrl,
                alt: `Gallery Image ${i + 1}`
              })
            }
            
            // Update UI in batches for better UX
            if (demoImages.length % BATCH_SIZE === 0 && isMounted) {
              setImages([...demoImages])
              if (demoImages.length === BATCH_SIZE) setLoading(false)
            }
          }
            
            if (isMounted) {
            setImages(demoImages)
            setLoading(false)
            }
          return
        }

        // For real properties, load from database
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