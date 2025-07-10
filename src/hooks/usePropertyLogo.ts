'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

export function usePropertyLogo(propertyId: string | undefined, isDemo?: boolean) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchPropertyLogo() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Try to load demo logo using centralized path
          const demoLogoUrl = await getDemoAssetUrl(supabase, DEMO_CONFIG.assets.property_logo)
              
          if (demoLogoUrl) {
            setLogoUrl(demoLogoUrl)
            return
          }

          // If no demo logo available, set to null (fallback will be handled by Header component)
          setLogoUrl(null)
          return
        }

        // For regular properties, query the database with correct category
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'property_logo')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setLogoUrl(null)
          return
        }

        const asset = data[0]
        if (!asset.storage_path) {
          throw new Error('No storage path found')
        }

        // Generate the public URL for the logo
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
              setLogoUrl(publicUrlData.publicUrl)
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
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('Error loading property logo:', err)
        
        // Retry logic
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, RETRY_DELAY)
          return
        }

        setError(err instanceof Error ? err.message : 'Failed to load property logo')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyLogo()

    return () => {
      controller.abort()
    }
  }, [propertyId, isDemo, supabase, retryCount])

  return { logoUrl, loading, error }
} 