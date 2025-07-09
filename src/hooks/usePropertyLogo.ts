'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function usePropertyLogo(propertyId: string | undefined) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchPropertyLogo() {
      try {
        setLoading(true)
        setError(null)

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'logo')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          console.error('Supabase error:', dbError)
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
          setLogoUrl(publicUrlData.publicUrl)
        } else {
          throw new Error('Failed to generate public URL')
        }

      } catch (err) {
        console.error('Error loading property logo:', err)
        setError(err instanceof Error ? err.message : 'Failed to load property logo')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyLogo()
  }, [propertyId, supabase])

  return { logoUrl, loading, error }
} 