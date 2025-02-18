'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useFeaturesBanner(propertyId?: string, isDemoProperty?: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadBanner() {
      if (!propertyId) {
        console.log('[useFeaturesBanner] No propertyId provided')
        setLoading(false)
        return
      }

      try {
        console.log('[useFeaturesBanner] Starting to load banner:', {
          propertyId,
          isDemoProperty
        })
        setLoading(true)
        setError(null)

        // If it's a demo property, use the demo banner
        if (isDemoProperty) {
          console.log('[useFeaturesBanner] Loading demo banner')
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
                console.log(`[useFeaturesBanner] Found banner image in ${format} format`)
                setImageUrl(publicUrlData.publicUrl)
                foundImage = true
                break
              }
            } catch {
              console.log(`[useFeaturesBanner] No ${format} format found for banner image`)
            }
          }

          if (!foundImage) {
            console.error('[useFeaturesBanner] No supported image format found for demo banner')
            setImageUrl(null)
          }
          return
        }

        // Otherwise, query the assets table for a real property
        console.log('[useFeaturesBanner] Fetching banner for property:', propertyId)
        const { data, error } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'features_banner')
          .eq('status', 'active')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('[useFeaturesBanner] No features banner found for property')
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
        console.error('[useFeaturesBanner] Error loading features banner:', err)
        setError(err instanceof Error ? err : new Error('Failed to load features banner'))
      } finally {
        setLoading(false)
      }
    }

    loadBanner()
  }, [supabase, propertyId, isDemoProperty])

  return { imageUrl, loading, error }
} 