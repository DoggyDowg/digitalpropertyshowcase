'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Property, FooterLink } from '@/types/property'

export function useProperty(propertyId: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    const fetchProperty = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            agency_settings:agency_settings!agency_id (
              *
            )
          `)
          .eq('id', propertyId)
          .single()

        if (propertyError) {
          throw new Error(`Property not found: ${propertyError.message}`)
        }

        if (!propertyData) {
          throw new Error('No property data returned')
        }

        setProperty(propertyData)
      } catch (err) {
        console.error('Error loading property:', err)
        setError(err instanceof Error ? err : new Error('Failed to load property'))
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId, supabase])

  // Compute derived values
  const agencyBranding = useMemo(() => {
    return property?.agency_settings?.branding || null
  }, [property?.agency_settings?.branding])

  // Merge default footer links with property footer links
  const mergedFooterLinks = useMemo<FooterLink[]>(() => {
    const defaultFooterLinks: FooterLink[] = [
      { id: 'home', title: 'Visit Us', url: '' },
      { id: 'phone', title: 'Call Us', url: '' },
      { id: 'email', title: 'Email Us', url: '' },
      { id: 'facebook', title: 'Facebook', url: '' },
      { id: 'instagram', title: 'Instagram', url: '' },
      { id: 'link1', title: 'Sell Your Home', url: '' },
      { id: 'link2', title: 'Rent Your Home', url: '' },
      { id: 'link3', title: 'Buy a Home', url: '' }
    ]

    if (!property?.footer_links) {
      return defaultFooterLinks
    }

    // Merge with existing links, preserving custom values
    const mergedLinks = defaultFooterLinks.map(defaultLink => {
      const existingLink = property.footer_links?.find(link => link.id === defaultLink.id)
      return existingLink || defaultLink
    })

    return mergedLinks
  }, [property?.footer_links])

  return {
    property: property ? {
      ...property,
      footer_links: mergedFooterLinks
    } : null,
    agencyBranding,
    loading,
    error
  }
} 