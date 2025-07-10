import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DEMO_CONFIG, getDemoAssetUrl } from '@/config/demo'

export function use3DTour(propertyId: string | undefined, isDemo?: boolean) {
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

        // Check if it's a demo property using centralized logic
        const isDemoProperty = DEMO_CONFIG.isDemoProperty(propertyId, isDemo)

        if (isDemoProperty) {
          // Try to load demo 3D tour using centralized path
          const demoTourUrl = await getDemoAssetUrl(supabase, DEMO_CONFIG.assets.tour_3d)
          
          if (demoTourUrl) {
            setTourUrl(demoTourUrl)
                return
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
          // Verify the 3D tour is accessible
          try {
            const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
            if (response.ok) {
              setTourUrl(publicUrlData.publicUrl)
            } else {
              throw new Error('3D tour not accessible')
            }
          } catch {
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
  }, [propertyId, isDemo, supabase])

  return { tourUrl, loading, error }
} 