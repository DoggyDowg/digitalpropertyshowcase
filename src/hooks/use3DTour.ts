import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function use3DTour(propertyId: string | undefined) {
  const [tourUrl, setTourUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetch3DTour() {
      try {
        setLoading(true)
        setError(null)

        // Check if it's a demo property
        const isDemo = propertyId?.includes('/demo/') || false

        if (isDemo) {
          // Try demo 3D tour
          const { data: publicUrlData } = supabase.storage
            .from('property-assets')
            .getPublicUrl('demo/3d-tour/tour.html')

          if (publicUrlData?.publicUrl) {
            // Test if the tour is accessible
            try {
              const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
              if (response.ok) {
                setTourUrl(publicUrlData.publicUrl)
                return
              }
            } catch (err) {
              // Continue to error handling
            }
          }

          setError('Demo 3D tour not found')
          return
        }

        // For regular properties, query the database
        const { data, error: dbError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', propertyId)
          .eq('category', '3d_tour')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }

        if (!data || data.length === 0) {
          setTourUrl(null)
          return
        }

        const asset = data[0]
        if (!asset.storage_path) {
          throw new Error('No storage path found')
        }

        // Generate the public URL for the 3D tour
        const { data: publicUrlData } = supabase.storage
          .from('property-assets')
          .getPublicUrl(asset.storage_path)

        if (publicUrlData?.publicUrl) {
          // Verify the tour is accessible
          try {
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (response.ok) {
              setTourUrl(publicUrlData.publicUrl)
            } else {
              throw new Error('3D tour not accessible')
            }
          } catch (verifyErr) {
            throw new Error('3D tour verification failed')
          }
        } else {
          throw new Error('Failed to generate public URL')
        }

      } catch (err) {
        console.error('Error loading 3D tour:', err)
        setError(err instanceof Error ? err.message : 'Failed to load 3D tour')
      } finally {
        setLoading(false)
      }
    }

    fetch3DTour()
  }, [propertyId, supabase])

  return { tourUrl, loading, error }
} 