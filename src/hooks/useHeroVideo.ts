'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

export function useHeroVideo(propertyId: string | undefined, isDemo?: boolean) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchHeroVideo() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Try to load demo video using centralized path
          const demoVideoUrl = await getDemoAssetUrl(supabase, DEMO_CONFIG.assets.hero_video)
          
          if (demoVideoUrl) {
            console.log('Demo video loaded successfully:', demoVideoUrl)
            setVideoUrl(demoVideoUrl)
            return
          }

          console.warn('Demo video not found')
          setError('Demo video not found')
          setVideoUrl(null)
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'hero_video')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setVideoUrl(null)
          return
        }

        const asset = data[0]
        if (!asset.storage_path) {
          throw new Error('No storage path found')
        }

        // Generate the public URL for the video
        const { data: publicUrlData } = supabase.storage
          .from('property-assets')
          .getPublicUrl(asset.storage_path)

        if (publicUrlData?.publicUrl) {
          // Verify the video is accessible
        try {
          const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (response.ok) {
          setVideoUrl(publicUrlData.publicUrl)
            } else {
              throw new Error('Video not accessible')
            }
        } catch {
            throw new Error('Video verification failed')
          }
        } else {
          throw new Error('Failed to generate public URL')
        }

      } catch (err) {
        console.error('Error loading hero video:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hero video')
      } finally {
        setLoading(false)
      }
    }

    fetchHeroVideo()
  }, [propertyId, isDemo, supabase])

  return { videoUrl, loading, error }
}