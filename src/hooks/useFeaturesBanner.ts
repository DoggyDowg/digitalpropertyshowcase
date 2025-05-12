'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useFeaturesBanner(propertyId: string, isDemo = false) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadBanner() {
      if (!propertyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // If it's a demo property, use the demo banner
        if (isDemo) {
          const supportedFormats = ['webp', 'jpg', 'jpeg', 'png']
          let foundImage = false
          
          for (const format of supportedFormats) {
            const { data: publicUrlData } = supabase
              .storage
              .from('property-assets')
              .getPublicUrl(`demo/features_banner/banner.${format}`)

            // Verify if the image exists
            try {
              const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
              if (response.ok) {
                setImageUrl(publicUrlData.publicUrl)
                foundImage = true
                break
              }
            } catch {
            }
          }

          if (!foundImage) {
            setImageUrl(null)
          }
          return
        }

        // Otherwise, query the assets table for a real property
        const { data, error } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'features_banner')
          .eq('status', 'active')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setImageUrl(null)
            return
          }
          throw error
        }

        if (data?.storage_path) {
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl(data.storage_path)

          setImageUrl(publicUrlData.publicUrl)
        } else {
          setImageUrl(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load features banner'))
      } finally {
        setLoading(false)
      }
    }

    loadBanner()
  }, [supabase, propertyId, isDemo])

  return { imageUrl, loading, error }
} 