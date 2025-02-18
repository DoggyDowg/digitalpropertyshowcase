'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Property, FooterLink } from '@/types/property'

export function useProperty(propertyId?: string) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true)
        setError(null)

        // First get the property to get its agency_id
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            agency_settings:agency_id (
              id,
              branding,
              footer_links,
              copyright,
              menu_items,
              office_addresses
            )
          `)
          .eq('id', propertyId)
          .single()

        if (propertyError) throw propertyError

        if (propertyData) {
          console.log('Property data loaded:', {
            id: propertyData.id,
            name: propertyData.name,
            is_demo: propertyData.is_demo,
            agency_id: propertyData.agency_id
          })
          console.log('Property data:', propertyData)
          console.log('Agency settings:', propertyData.agency_settings)

          // Add cache busting to logo URLs
          const agencyBranding = propertyData.agency_settings?.branding || {}
          if (agencyBranding.logo) {
            const timestamp = Date.now()
            if (agencyBranding.logo.dark && !agencyBranding.logo.dark.includes('?t=')) {
              agencyBranding.logo.dark = `${agencyBranding.logo.dark}?t=${timestamp}`
            }
            if (agencyBranding.logo.light && !agencyBranding.logo.light.includes('?t=')) {
              agencyBranding.logo.light = `${agencyBranding.logo.light}?t=${timestamp}`
            }
            // Add cache busting for favicon
            if (agencyBranding.favicon) {
              agencyBranding.favicon = `${agencyBranding.favicon}?t=${timestamp}`
            }
          }

          // Ensure all content sections are properly initialized
          const content = {
            ...propertyData.content,
            features: {
              ...propertyData.content?.features,
              banner_title: propertyData.content?.features?.banner_title || 'Your Home',
              items: Array.from({ length: 15 }, (_, i) => ({
                rank: i + 1,
                feature: propertyData.content?.features?.items?.[i]?.feature || ''
              })),
              header: propertyData.content?.features?.header || '',
              headline: propertyData.content?.features?.headline || ''
            },
            lifestyle: {
              ...propertyData.content?.lifestyle,
              banner_title: propertyData.content?.lifestyle?.banner_title || 'Your Lifestyle',
              header: propertyData.content?.lifestyle?.header || '',
              headline: propertyData.content?.lifestyle?.headline || '',
              description: propertyData.content?.lifestyle?.description || ''
            },
            neighbourhood: {
              ...propertyData.content?.neighbourhood,
              banner_title: propertyData.content?.neighbourhood?.banner_title || 'Your Neighbourhood',
              text: propertyData.content?.neighbourhood?.text || '',
              part1_headline: propertyData.content?.neighbourhood?.part1_headline || '',
              part1_text: propertyData.content?.neighbourhood?.part1_text || '',
              part2_headline: propertyData.content?.neighbourhood?.part2_headline || '',
              part2_text: propertyData.content?.neighbourhood?.part2_text || '',
              part3_headline: propertyData.content?.neighbourhood?.part3_headline || '',
              part3_text: propertyData.content?.neighbourhood?.part3_text || ''
            }
          }

          // Extract footer links and branding from agency settings data
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
          const existingLinks: FooterLink[] = propertyData.agency_settings?.footer_links || []
          const mergedFooterLinks = defaultFooterLinks.map(defaultLink => {
            const existingLink = existingLinks.find(link => link.id === defaultLink.id)
            return existingLink || defaultLink
          })
          
          console.log('Agency branding:', agencyBranding)
          console.log('Footer links:', mergedFooterLinks)

          setProperty({ 
            ...propertyData, 
            content, 
            footer_links: mergedFooterLinks,
            agency_id: propertyData.agency_settings?.id || propertyData.agency_id,
            agency_settings: {
              ...propertyData.agency_settings,
              branding: agencyBranding,
              menu_items: propertyData.agency_settings?.menu_items || {},
              office_addresses: propertyData.agency_settings?.office_addresses || []
            },
            updated_at: new Date().toISOString() // Force refresh by updating timestamp
          })
        }
      } catch (err) {
        console.error('Error loading property:', err)
        setError(err instanceof Error ? err : new Error('Failed to load property'))
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [supabase, propertyId])

  return { property, loading, error }
} 