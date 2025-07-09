'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useHeroVideo(propertyId: string | undefined) {
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

        // Check if it's a demo property (path-based)
        if (propertyId?.includes('demo/')) {
          const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl(propertyId)

          if (!publicUrlData?.publicUrl) {
            console.warn('Demo video not found at path:', propertyId)
            setError('Demo video not found')
            setVideoUrl(null) // Explicitly set to null instead of returning
            return
          }

          // Test if the video URL is accessible
          try {
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (!response.ok) {
              console.warn('Demo video not accessible:', publicUrlData.publicUrl, 'Status:', response.status)
              setError(`Demo video not accessible (${response.status})`)
              setVideoUrl(null) // Explicitly set to null instead of returning
              return
            }
            console.log('Demo video loaded successfully:', publicUrlData.publicUrl)
            setVideoUrl(publicUrlData.publicUrl)
          } catch (_verifyErr) {
            console.warn('Demo video URL verification failed:', _verifyErr)
            setError('Demo video URL verification failed')
            setVideoUrl(null) // Explicitly set to null instead of returning
            return
          }

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

        if (!data[0].storage_path) {
          setError('No storage path found')
          return
        }

        // Generate the public URL for the video
        const { data: publicUrlData } = supabase.storage
          .from('property-assets')
          .getPublicUrl(data[0].storage_path)

        if (!publicUrlData?.publicUrl) {
          setError('Failed to generate public URL')
          return
        }

        // Test if the video URL is accessible
        try {
          const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
          if (!response.ok) {
            setError(`Video not accessible`)
            return
          }
          setVideoUrl(publicUrlData.publicUrl)
        } catch {
          setError('Video URL verification failed')
          return
        }

      } catch (err) {
        console.error('Error loading hero video:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hero video')
      } finally {
        setLoading(false)
      }
    }

    fetchHeroVideo()
  }, [propertyId, supabase])

  return { videoUrl, loading, error }
}