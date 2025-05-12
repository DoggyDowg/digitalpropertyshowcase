'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Asset } from '@/types/assets'

export function useFooterImage(propertyId?: string, isDemoProperty?: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  // console.log(`[useFooterImage] Starting to load image for property: ${propertyId}`);
  // console.log(`[useFooterImage] Is demo property: ${isDemo}`);

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadImage() {
      if (!propertyId) {
        console.log('[useFooterImage] No propertyId provided')
        setLoading(false)
        return
      }

      try {
        // console.log(`[useFooterImage] Starting to load image for property: ${propertyId}`);
        // console.log(`[useFooterImage] Is demo property: ${isDemo}`);
        setLoading(true)
        setError(null)

        // If it's a demo property, use the demo image
        if (isDemoProperty) {
          console.log('[useFooterImage] Loading demo footer image')
          
          // Try different image formats in order of preference
          const supportedFormats = ['webp', 'jpg', 'jpeg', 'png']
          let foundImage = false
          
          for (const format of supportedFormats) {
            const { data: publicUrlData } = supabase
              .storage
              .from('property-assets')
              .getPublicUrl(`demo/footer/image.${format}`)

            console.log(`[useFooterImage] Trying format ${format}, URL:`, publicUrlData.publicUrl)

            // Verify if the image exists
            try {
              const response = await fetch(publicUrlData.publicUrl, { 
                method: 'HEAD',
                signal: controller.signal
              })
              if (response.ok) {
                console.log(`[useFooterImage] Found demo footer image in ${format} format`)
                if (isMounted) {
                  setImageUrl(publicUrlData.publicUrl)
                  foundImage = true
                  break
                }
              }
            } catch (err) {
              console.log(`[useFooterImage] Error checking ${format} format:`, err)
            }
          }

          if (!foundImage) {
            console.error('[useFooterImage] No supported image format found for demo footer')
            if (isMounted) {
              setImageUrl(null)
            }
          }
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        // Otherwise, query the assets table for a real property
        // console.log(`[useFooterImage] Fetching footer image for property: ${propertyId}`);
        const { data, error } = await supabase
          .from('assets')
          .select('storage_path, id')
          .eq('property_id', propertyId)
          .eq('category', 'footer')
          .eq('status', 'active')
          .single()

        if (error) {
          console.log('[useFooterImage] Database query error:', error)
          if (error.code === 'PGRST116') {
            console.log('[useFooterImage] No footer image found for property')
            if (isMounted) {
              setImageUrl(null)
              setLoading(false)
            }
            return
          }
          throw error
        }

        // console.log('[useFooterImage] Found asset data:', data); // Commented out log
        const asset = data as Asset;
        
        const { data: publicUrlData } = supabase
          .storage
          .from('property-assets')
          .getPublicUrl(asset.storage_path);

        // console.log('[useFooterImage] Generated public URL:', publicUrlData.publicUrl); // Commented out log

        if (publicUrlData.publicUrl) {
          setImageUrl(publicUrlData.publicUrl);
          
          // Verify the image exists
          try {
            const response = await fetch(publicUrlData.publicUrl, { 
              method: 'HEAD',
              signal: controller.signal
            })
            if (response.ok) {
              if (isMounted) {
                setImageUrl(publicUrlData.publicUrl)
              }
            } else {
              throw new Error('Image not accessible')
            }
          } catch (err) {
            console.error('[useFooterImage] Error verifying image accessibility:', err)
            throw err
          }
        } else {
          console.log('[useFooterImage] No storage path found in asset data')
          if (isMounted) {
            setImageUrl(null)
          }
        }
      } catch (err) {
        // Ignore AbortError as it's expected if the component unmounts/re-renders
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[useFooterImage] Fetch aborted, likely due to component unmount or re-render.');
        } else {
          console.error('[useFooterImage] Error loading footer image:', err);
          if (isMounted) {
            setError(err instanceof Error ? err : new Error('Failed to load footer image'));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
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