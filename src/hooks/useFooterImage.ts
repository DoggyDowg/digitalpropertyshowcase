'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useFooterImage(propertyId: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchFooterImage() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property
        const isDemo = propertyId?.includes('/demo/') || false

        if (isDemo) {
          // Try different image formats for demo
          const formats = ['webp', 'jpg', 'jpeg', 'png']
          let foundImage = false

          for (const format of formats) {
            if (controller.signal.aborted) return

            try {
              if (!propertyId) return
              const imagePath = `${propertyId.replace(/\.(webp|jpg|jpeg|png)$/i, '')}.${format}`
              const { data: publicUrlData } = supabase.storage
                .from('property-assets')
                .getPublicUrl(imagePath)

              if (publicUrlData?.publicUrl) {
                // Test if the image is accessible
                const response = await fetch(publicUrlData.publicUrl, { 
                  method: 'HEAD',
                  signal: controller.signal
                })
                
                if (response.ok) {
                  setImageUrl(publicUrlData.publicUrl)
                  foundImage = true
                  break
                }
              }
            } catch {
              // Continue to next format
            }
          }

          if (!foundImage) {
            setError('No supported image format found for demo footer')
          }
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'footer_image')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          setError(`Database query error: ${dbError.message}`)
          return
        }

        if (!data || data.length === 0) {
          setImageUrl(null)
          return
        }

        const asset = data[0]
        if (!asset.storage_path) {
          setError('No storage path found in asset data')
          return
        }

        // Generate the public URL for the image
        const { data: publicUrlData } = supabase.storage
          .from('property-assets')
          .getPublicUrl(asset.storage_path)

        if (publicUrlData?.publicUrl) {
          // Verify the image is accessible
          try {
            const response = await fetch(publicUrlData.publicUrl, { 
              method: 'HEAD',
              signal: controller.signal
            })
            if (response.ok) {
              setImageUrl(publicUrlData.publicUrl)
            } else {
              setError('Image not accessible')
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              return
            }
            setError('Error verifying image accessibility')
          }
        }

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Error loading footer image:', err)
        setError(err instanceof Error ? err.message : 'Failed to load footer image')
      } finally {
        setLoading(false)
      }
    }

    fetchFooterImage()

    return () => {
      controller.abort()
    }
  }, [propertyId, supabase])

  return { imageUrl, loading, error }
} 