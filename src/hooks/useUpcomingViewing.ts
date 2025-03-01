import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Viewing } from '@/types/property'

export function useUpcomingViewing(propertyId?: string) {
  const [upcomingViewing, setUpcomingViewing] = useState<Viewing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadUpcomingViewing() {
      if (!propertyId) {
        console.log('No propertyId provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log('Fetching upcoming viewing for property:', propertyId)

        const now = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('viewings')
          .select('*')
          .eq('property_id', propertyId)
          .eq('status', 'scheduled')
          .gt('viewing_datetime', now) // Only get future viewings
          .order('viewing_datetime', { ascending: true }) // Get the next upcoming viewing
          .limit(1)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No upcoming viewings found')
            setUpcomingViewing(null)
            return
          }
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Viewing data:', data)
        setUpcomingViewing(data)
      } catch (err) {
        console.error('Detailed error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load upcoming viewing'))
      } finally {
        setLoading(false)
      }
    }

    loadUpcomingViewing()
  }, [supabase, propertyId])

  return { upcomingViewing, loading, error }
} 