'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

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

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Try to load demo image using centralized path
          const demoImageUrl = await getDemoAssetUrl(supabase, DEMO_CONFIG.assets.features_banner)
          
          if (demoImageUrl) {
            setImageUrl(demoImageUrl)
            return
          }

            setImageUrl(null)
          return
        }

        // For regular properties, query the database
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

        if (!data?.storage_path) {
          setImageUrl(null)
          return
        }

        // Generate the public URL for the image
        const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl(data.storage_path)

        if (publicUrlData?.publicUrl) {
          // Verify the image is accessible
          try {
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (response.ok) {
          setImageUrl(publicUrlData.publicUrl)
            } else {
              throw new Error('Image not accessible')
            }
          } catch {
            throw new Error('Image verification failed')
          }
        } else {
          throw new Error('Failed to generate public URL')
        }

      } catch (err) {
        console.error('Error loading features banner:', err)
        setError(err instanceof Error ? err : new Error('Failed to load features banner'))
      } finally {
        setLoading(false)
      }
    }

    loadBanner()
  }, [propertyId, isDemo, supabase])

  return { imageUrl, loading, error }
} 