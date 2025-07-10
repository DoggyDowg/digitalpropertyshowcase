'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

export function useAerialImages(propertyId: string | undefined, isDemo?: boolean) {
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

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Load demo aerial images using centralized paths
          const imageUrls: string[] = []
          
          for (let i = 0; i < DEMO_CONFIG.assets.aerials.length; i++) {
            const imagePath = DEMO_CONFIG.assets.aerials[i]
            const imageUrl = await getDemoAssetUrl(supabase, imagePath)
            
            if (imageUrl) {
              imageUrls.push(imageUrl)
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
          .eq('category', 'aerials')
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setImages([])
          return
        }

        // Generate public URLs for all aerial images
        const aerialUrls = await Promise.all(
          data.map(async (asset) => {
          const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl(asset.storage_path)

            return publicUrlData.publicUrl
        })
        )
        
        setImages(aerialUrls)

      } catch (err) {
        console.error('Error loading aerial images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load aerial images')
      } finally {
        setLoading(false)
      }
    }

    fetchAerialImages()
  }, [propertyId, isDemo, supabase])

  return { images, loading, error }
} 