import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Viewing = {
  id: string
  property_id: string
  date: string
  start_time: string
  end_time: string
  timezone: string
  title: string
  description: string
  location: string
  created_at: string
  updated_at: string
}

export function useUpcomingViewing(propertyId: string | undefined) {
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchUpcomingViewing() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from('viewings')
          .select('*')
          .eq('property_id', propertyId)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(1)

        if (dbError) {
          console.error('Supabase error:', dbError)
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (data && data.length > 0) {
          setViewing(data[0])
        } else {
          setViewing(null)
        }

      } catch (err) {
        console.error('Error fetching upcoming viewing:', err)
        setError(err instanceof Error ? err.message : 'Failed to load upcoming viewing')
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingViewing()
  }, [propertyId, supabase])

  return { viewing, loading, error }
} 