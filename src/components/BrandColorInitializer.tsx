'use client'

import { useEffect } from 'react'
import { updateBrandColors } from '@/utils/updateBrandColors'
import type { Property, AgencyBranding } from '@/types/property'

interface BrandColorInitializerProps {
  property: Property | null | undefined
}

const defaultColors: AgencyBranding['colors'] = {
  dark: '#000000',
  light: '#FFFFFF',
  accent: '#000000'
}

const BrandColorInitializer = ({ property }: BrandColorInitializerProps) => {
  useEffect(() => {
    try {
      // console.error('[BrandColor] Initializing with property:', property)

      // 1. Null-safe navigation for ENTIRE chain
      const colors = property?.agency_settings?.branding?.colors
      
      // 2. Validate colors structure before destructuring
      const validatedColors = (colors && typeof colors === 'object')
        ? colors
        : defaultColors

      // 3. Destructure with explicit fallbacks
      const {
        dark = defaultColors.dark,
        light = defaultColors.light,
        accent = defaultColors.accent
      } = validatedColors

      // console.error('[BrandColor] Resolved colors:', { dark, light, accent })

      // Validate colors before applying
      if (!dark || !light) {
        throw new Error('Required colors missing or invalid')
      }

      // Apply the validated colors
      const result = updateBrandColors({
        dark,
        light,
        highlight: accent
      })

      // console.error('[BrandColor] Colors applied successfully:', result)
    } catch (error) {
      console.error('[BrandColor] Critical Error:', error)
      
      // In case of any error, fall back to default colors
      updateBrandColors({
        dark: defaultColors.dark,
        light: defaultColors.light,
        highlight: defaultColors.accent
      })
    }
  }, [property])


  return null
}

export { BrandColorInitializer }