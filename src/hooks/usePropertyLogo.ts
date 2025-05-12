'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function usePropertyLogo(propertyId?: string) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadLogo() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        // console.log('Fetching logo for property:', propertyId)

        const { data, error } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'property_logo')
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        // console.log('Asset data:', data)

        if (data?.storage_path) {
          // Get the public URL for the asset
          const { data: publicUrlData } = supabase
            .storage
            .from('property-assets')
            .getPublicUrl(data.storage_path)

          // console.log('Public URL:', publicUrlData)
          setLogoUrl(publicUrlData.publicUrl)
        } else {
          // console.log('No logo found for property'); // Commented out
        }
      } catch (err) {
        console.error('Detailed error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load property logo'))
      } finally {
        setLoading(false)
      }
    }

    loadLogo()
  }, [supabase, propertyId])

  return { logoUrl, loading, error }
} 