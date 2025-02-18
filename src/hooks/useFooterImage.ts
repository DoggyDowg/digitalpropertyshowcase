'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useFooterImage(propertyId?: string, isDemoProperty?: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadImage() {
      if (!propertyId) {
        setImageUrl(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data: footerImage, error: footerError } = await supabase
          .storage
          .from('property-images')
          .download(`${propertyId}/footer.jpg`)

        if (footerError) {
          console.error('[useFooterImage] Error fetching footer image:', footerError)
          if (isMounted) {
            setError(footerError)
            setLoading(false)
          }
          return
        }

        const imageUrl = URL.createObjectURL(footerImage)
        if (isMounted) {
          setImageUrl(imageUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error('[useFooterImage] Error:', err)
        if (isMounted) {
          setError(err as Error)
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