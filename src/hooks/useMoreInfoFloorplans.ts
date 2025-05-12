'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Asset } from '@/types/assets'

export function useMoreInfoFloorplans(propertyId?: string, isDemoProperty?: boolean) {
  const [floorplans, setFloorplans] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    async function loadFloorplans() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // console.log('Fetching floorplans for property:', propertyId)
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('property_id', propertyId)
          .eq('category', 'floorplan')
          .eq('status', 'active')

        if (error) throw error

        if (isMounted) {
          setFloorplans(data || [])
        }
      } catch (err) {
        console.error('Error loading floorplans:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load floorplans'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFloorplans()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [supabase, propertyId, isDemoProperty])

  return { floorplans, loading, error }
} 