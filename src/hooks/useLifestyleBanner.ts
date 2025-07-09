'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useLifestyleBanner(propertyId: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchLifestyleBanner() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property
        const isDemo = propertyId?.includes('/demo/') || false

        if (isDemo) {
          // Try different formats for demo image
          const formats = ['webp', 'jpg', 'jpeg', 'png']
          
          for (const format of formats) {
            try {
              const { data: publicUrlData } = supabase.storage
                .from('property-assets')
                .getPublicUrl(`demo/lifestyle/banner.${format}`)

              if (publicUrlData?.publicUrl) {
                // Test if the image is accessible
                const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
                if (response.ok) {
                  setImageUrl(publicUrlData.publicUrl)
                  return
                }
              }
            } catch {
              // Continue to next format
            }
          }

          setError('No supported image format found for demo lifestyle banner')
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'lifestyle_banner')
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
        console.error('Error loading lifestyle banner:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lifestyle banner')
      } finally {
        setLoading(false)
      }
    }

    fetchLifestyleBanner()
  }, [propertyId, supabase])

  return { imageUrl, loading, error }
} 