'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

export function useNeighbourhoodBanner(propertyId: string | undefined, isDemo?: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchNeighbourhoodBanner() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Try to load demo image using centralized path
          const demoImageUrl = await getDemoAssetUrl(supabase, DEMO_CONFIG.assets.neighbourhood_banner)

          if (demoImageUrl) {
            setImageUrl(demoImageUrl)
                  return
          }

          setError('Demo neighbourhood banner not found')
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'neighbourhood_banner')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setImageUrl(null)
          return
        }

        const asset = data[0]
        if (!asset.storage_path) {
          throw new Error('No storage path found')
        }

        // Generate the public URL for the image
        const { data: publicUrlData } = supabase.storage
          .from('property-assets')
          .getPublicUrl(asset.storage_path)

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
        console.error('Error loading neighbourhood banner:', err)
        setError(err instanceof Error ? err.message : 'Failed to load neighbourhood banner')
      } finally {
        setLoading(false)
      }
    }

    fetchNeighbourhoodBanner()
  }, [propertyId, isDemo, supabase])

  return { imageUrl, loading, error }
} 