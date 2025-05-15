'use client'

import { useEffect, useState } from 'react'
import { CuscoTemplate } from '@/templates/cusco/page'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Property } from '@/types/property'

export default function Home() {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const testPropertyId = '144e229e-34c9-4fa9-bb16-cfdc0dd0937a'
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadProperty() {
      console.log('Starting to load property...')
      
      // Add a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached')
        setLoading(false)
        setProperty(null)
      }, 5000) // 5 second timeout

      try {
        console.log('Fetching from Supabase...')
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            agency_settings:agency_settings!agency_id (*),
            assets(*)
          `)
          .eq('id', testPropertyId)
          .single()

        clearTimeout(timeout) // Clear timeout if successful

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        console.log('Property data received:', data ? 'success' : 'null')
        setProperty(data)
      } catch (err) {
        console.error('Error loading property:', err)
        setProperty(null)
      } finally {
        clearTimeout(timeout) // Clear timeout in case of error
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    loadProperty()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">Property not found</p>
        </div>
      </div>
    )
  }

  return <CuscoTemplate property={property} />
}
