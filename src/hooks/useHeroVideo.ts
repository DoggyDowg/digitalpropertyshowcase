'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useHeroVideo(propertyId?: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadVideo() {
      setLoading(true)
      setError(null)
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // If the propertyId includes 'demo/', it's a direct path to the demo asset
        if (propertyId.startsWith('demo/')) {
          // console.log('Loading demo video from path:', propertyId); // Commented out
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl(propertyId)

          // console.log('Demo video response:', publicUrlData); // Commented out
          if (!publicUrlData.publicUrl) {
            console.error('No public URL returned for demo video')
            setVideoUrl(null)
            return
          }
          setVideoUrl(publicUrlData.publicUrl)
          // console.log('Successfully set demo video URL:', publicUrlData.publicUrl); // Commented out
          return
        }

        // Otherwise, query the assets table for a real property
        // console.log(`Fetching hero video for property: ${propertyId}`)
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
            // console.log('No hero video found for property'); // Commented out
            setVideoUrl(null)
            return
          }
          throw error
        }

        // console.log('Asset data:', data) // Commented out log

        const storagePath = data?.storage_path;
        if (!storagePath) {
          // console.log(`No active hero video found for property ${propertyId}`)
          setError(new Error('No video found'))
          setLoading(false)
          return;
        }

        // Get the public URL for the asset
        const { data: publicUrlData } = supabase
          .storage
          .from('property-assets')
          .getPublicUrl(storagePath)

        // console.log('Public URL:', publicUrlData) // Commented out log
        setVideoUrl(publicUrlData.publicUrl)
      } catch (err) {
        console.error('Error loading hero video:', err)
        setError(err instanceof Error ? err : new Error('Failed to load hero video'))
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [supabase, propertyId])

  return { videoUrl, loading, error }
}