'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AerialImage {
  id: string;
  src: string;
  alt: string;
}

export function useAerialImages(propertyId: string | undefined) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchAerialImages() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property
        const isDemo = propertyId?.includes('/demo/') || false

        if (isDemo) {
          // Load demo aerial images
          const imageUrls: string[] = []
          const formats = ['webp', 'jpg', 'jpeg', 'png']
          
          for (let i = 1; i <= 6; i++) {
            let foundImage = false
            
            for (const format of formats) {
              if (foundImage) break
              
              try {
                const { data: publicUrlData } = supabase.storage
                  .from('property-assets')
                  .getPublicUrl(`demo/aerial/${i}.${format}`)

                if (publicUrlData?.publicUrl) {
                  // Test if the image is accessible
                  const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
                  if (response.ok) {
                    imageUrls.push(publicUrlData.publicUrl)
                    foundImage = true
                  }
                }
              } catch (err) {
                // Continue to next format
              }
            }
          }

          setImages(imageUrls)
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'aerial')
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setImages([])
          return
        }

        // Generate public URLs for all images
        const imagePromises = data.map(async (asset) => {
          if (!asset.storage_path) return null

          const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl(asset.storage_path)

          return publicUrlData?.publicUrl || null
        })

        const imageUrls = await Promise.all(imagePromises)
        const validUrls = imageUrls.filter((url): url is string => url !== null)
        
        setImages(validUrls)

      } catch (err) {
        console.error('Error loading aerial images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load aerial images')
      } finally {
        setLoading(false)
      }
    }

    fetchAerialImages()
  }, [propertyId, supabase])

  return { images, loading, error }
} 