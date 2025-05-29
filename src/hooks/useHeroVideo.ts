'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useHeroVideo(propertyId?: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log('useHeroVideo: Hook called with propertyId:', propertyId)
    
    async function loadVideo() {
      setLoading(true)
      setError(null)
      if (!propertyId) {
        console.log('useHeroVideo: No propertyId provided')
        setLoading(false)
        return
      }

      try {
        // If the propertyId includes 'demo/', it's a direct path to the demo asset
        if (propertyId.startsWith('demo/')) {
          console.log('useHeroVideo: Loading demo video from path:', propertyId)
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl(propertyId)

          console.log('useHeroVideo: Demo video response:', publicUrlData)
          if (!publicUrlData.publicUrl) {
            console.error('useHeroVideo: No public URL returned for demo video')
            setVideoUrl(null)
            setLoading(false)
            return
          }
          
          // Verify the video URL is accessible
          try {
            console.log('useHeroVideo: Verifying demo video URL:', publicUrlData.publicUrl)
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (!response.ok) {
              console.error(`useHeroVideo: Demo video URL returned ${response.status}`)
              setVideoUrl(null)
              setError(new Error(`Video URL returned ${response.status}`))
              setLoading(false)
              return
            }
            console.log('useHeroVideo: Demo video URL is valid')
          } catch (verifyErr) {
            console.error('useHeroVideo: Error verifying demo video URL:', verifyErr)
          }
          
          setVideoUrl(publicUrlData.publicUrl)
          console.log('useHeroVideo: Successfully set demo video URL:', publicUrlData.publicUrl)
          setLoading(false)
          return
        }

        // Otherwise, query the assets table for a real property
        console.log(`useHeroVideo: Fetching hero video for property: ${propertyId}`)
        const { data, error } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'hero_video')
          .eq('status', 'active')
          .single()

        if (error) {
          // If no video found, this is not an error condition
          if (error.code === 'PGRST116') {
            console.log('useHeroVideo: No hero video found for property')
            setVideoUrl(null)
            setLoading(false)
            return
          }
          throw error
        }

        console.log('useHeroVideo: Asset data:', data)

        const storagePath = data?.storage_path;
        if (!storagePath) {
          console.log(`useHeroVideo: No active hero video found for property ${propertyId}`)
          setError(new Error('No video found'))
          setLoading(false)
          return;
        }

        // Get the public URL for the asset
        const { data: publicUrlData } = supabase
          .storage
          .from('property-assets')
          .getPublicUrl(storagePath)

        console.log('useHeroVideo: Public URL:', publicUrlData)
        
        // Verify the video URL is accessible
        try {
          console.log('useHeroVideo: Verifying video URL:', publicUrlData.publicUrl)
          const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
          if (!response.ok) {
            console.error(`useHeroVideo: Video URL returned ${response.status}`)
            setVideoUrl(null)
            setError(new Error(`Video URL returned ${response.status}`))
            setLoading(false)
            return
          }
          console.log('useHeroVideo: Video URL is valid')
        } catch (verifyErr) {
          console.error('useHeroVideo: Error verifying video URL:', verifyErr)
        }
        
        setVideoUrl(publicUrlData.publicUrl)
        setLoading(false)
      } catch (err) {
        console.error('useHeroVideo: Error loading hero video:', err)
        setError(err instanceof Error ? err : new Error('Failed to load hero video'))
        setLoading(false)
      }
    }

    loadVideo()
  }, [supabase, propertyId])

  return { videoUrl, loading, error }
}