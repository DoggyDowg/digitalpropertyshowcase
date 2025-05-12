'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export function useYourHomeImage(propertyId?: string, isDemoProperty?: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const controller = new AbortController()

    async function loadImage() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // If it's a demo property, use the demo banner
        if (isDemoProperty) {
          console.log('Loading demo your home banner, attempt:', retryCount + 1)
          // Prioritize WebP for better performance
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl('demo/your_home/banner.webp')

          try {
            const response = await fetch(publicUrlData.publicUrl, { 
              method: 'HEAD',
              signal: controller.signal
            })
            
            if (response.ok) {
              console.log('Successfully loaded demo your home banner')
              if (isMounted) {
                setImageUrl(publicUrlData.publicUrl)
                setLoading(false)
              }
              return
            }
          } catch (err) {
            console.log('Error checking WebP banner:', err)
            // Fall back to JPG if WebP fails
            const jpgData = supabase
              .storage
              .from('property-assets')
              .getPublicUrl('demo/your_home/banner.jpg')

            if (isMounted) {
              setImageUrl(jpgData.data.publicUrl)
              setLoading(false)
            }
            return
          }
        }

        // For real properties, query the assets table
        // console.log(`Fetching your home banner for property: ${propertyId} attempt: ${retryCount + 1}`)
        const { data, error } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'your_home')
          .eq('status', 'active')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No your home banner found for property')
            if (isMounted) {
              setImageUrl(null)
              setLoading(false)
            }
            return
          }
          throw error
        }

        if (data?.storage_path) {
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl(data.storage_path)

          if (isMounted) {
            setImageUrl(publicUrlData.publicUrl)
            setLoading(false)
          }
        } else {
          if (isMounted) {
            setImageUrl(null)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Error loading your home banner:', err)
        
        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms... (${retryCount + 1}/${MAX_RETRIES})`)
          retryCount++
          setTimeout(loadImage, RETRY_DELAY)
        } else {
          if (isMounted) {
            setError(err instanceof Error ? err : new Error('Failed to load your home banner'))
            setLoading(false)
          }
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [supabase, propertyId, isDemoProperty])

  return { imageUrl, loading, error }
} 