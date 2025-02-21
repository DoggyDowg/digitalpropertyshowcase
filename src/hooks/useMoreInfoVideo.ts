'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface VideoData {
  videoUrl: string | null
  videoType: 'upload' | 'youtube' | null
  loading: boolean
  error: Error | null
}

export function useMoreInfoVideo(propertyId: string, isDemoProperty: boolean): VideoData {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<'upload' | 'youtube' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadVideo() {
      try {
        setLoading(true)
        setError(null)

        // First try to get promo video
        const { data: promoVideo, error: promoError } = await supabase
          .from('assets')
          .select('*')
          .eq('property_id', propertyId)
          .eq('type', 'video')
          .eq('video_type', 'promo')
          .single()

        if (promoError && promoError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw promoError
        }

        // If no promo video, try to get hero video
        if (!promoVideo) {
          const { data: heroVideo, error: heroError } = await supabase
            .from('assets')
            .select('*')
            .eq('property_id', propertyId)
            .eq('type', 'video')
            .eq('video_type', 'hero')
            .single()

          if (heroError && heroError.code !== 'PGRST116') {
            throw heroError
          }

          if (heroVideo) {
            if (heroVideo.source_type === 'youtube') {
              setVideoUrl(heroVideo.external_url)
              setVideoType('youtube')
            } else {
              setVideoUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${heroVideo.storage_path}`)
              setVideoType('upload')
            }
          }
        } else {
          // Use promo video
          if (promoVideo.source_type === 'youtube') {
            setVideoUrl(promoVideo.external_url)
            setVideoType('youtube')
          } else {
            setVideoUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${promoVideo.storage_path}`)
            setVideoType('upload')
          }
        }
      } catch (err) {
        console.error('Error loading video:', err)
        setError(err instanceof Error ? err : new Error('Failed to load video'))
      } finally {
        setLoading(false)
      }
    }

    if (!isDemoProperty) {
      loadVideo()
    } else {
      setLoading(false)
    }
  }, [propertyId, isDemoProperty, supabase])

  return { videoUrl, videoType, loading, error }
} 