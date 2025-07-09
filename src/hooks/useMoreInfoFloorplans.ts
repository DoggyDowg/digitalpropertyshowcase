'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useMoreInfoFloorplans(propertyId: string | undefined) {
  const [floorplans, setFloorplans] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchFloorplans() {
      try {
        setLoading(true)
        setError(null)

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', 'floorplan')
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setFloorplans([])
          return
        }

        // Generate public URLs for all floorplans
        const floorplanPromises = data.map(async (asset) => {
          if (!asset.storage_path) return null

          const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl(asset.storage_path)

          return publicUrlData?.publicUrl || null
        })

        const floorplanUrls = await Promise.all(floorplanPromises)
        const validUrls = floorplanUrls.filter((url): url is string => url !== null)
        
        setFloorplans(validUrls)

      } catch (err) {
        console.error('Error loading floorplans:', err)
        setError(err instanceof Error ? err.message : 'Failed to load floorplans')
      } finally {
        setLoading(false)
      }
    }

    fetchFloorplans()
  }, [propertyId, supabase])

  return { floorplans, loading, error }
} 