import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Agent {
  id: string
  name: string
  position: string
  email: string
  phone: string
  avatar_url: string
  office_address: string
}

export function useAgent(agentId: string | undefined | null) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchAgent() {
      if (!agentId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .single()

        if (error) throw error

        // console.log('Agent data:', data) // Commented out log
        setAgent(data)
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch agent'))
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [agentId, supabase])

  return { agent, loading, error }
}