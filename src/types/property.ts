import type { PropertyAssets } from './assets';

/**
 * Defines the available hover effect types for text links in property showcases.
 * 
 * This type is used across the application to ensure type safety when setting
 * and utilizing hover effects. It's referenced by:
 * 
 * 1. The property data model (database schema)
 * 2. The PropertyStyling component (admin interface)
 * 3. The StyleFixer component (dynamic CSS generation)
 * 4. The HoverEffects.module.css file (admin preview styles)
 * 
 * To add a new hover effect:
 * 1. Add the new effect name to this type definition
 * 2. Add the effect to the HOVER_EFFECTS array in PropertyStyling.tsx
 * 3. Add CSS for the effect in HoverEffects.module.css
 * 4. Implement the dynamic CSS in StyleFixer
 */
export type HoverEffectType = 'scale' | 'underline' | 'slide' | 'fade' | 'glow';
export type HeaderStyleType = 'light' | 'dark';

export interface PropertyFeature {
  rank: number
  feature: string
}

export interface PropertyContent {
  hero: {
    headline: string
    subheadline: string
  }
  transition_headline?: string
  transition_text?: string
  features: {
    items: PropertyFeature[]
    header: string
    headline: string
    banner_title?: string
    description: string
  }
  lifestyle: {
    header: string
    headline: string
    description: string
    banner_title?: string
  }
  neighbourhood: {
    text: string
    part1_headline: string
    part1_text: string
    part2_headline: string
    part2_text: string
    part3_headline: string
    part3_text: string
    banner_title?: string
  }
  seo: {
    title: string
    description: string
  }
  og: {
    title: string
    description: string
  }
}

export interface AgencyBranding {
  logo: {
    dark: string
    light: string
  }
  colors: {
    dark: string
    light: string
    accent: string
  }
  favicon?: string
  typography: {
    bodyFont: {
      url: string
      name: string
    }
    headingFont: {
      url: string
      name: string
    }
  }
}

export interface OfficeAddress {
  id: string
  name: string
  street_address: string
  suburb: string
  state_postcode: string
  phone: string
}

export interface FooterLink {
  id: string
  title: string
  url: string
}

export interface Viewing {
  id: string
  property_id: string
  viewing_datetime: string
  type: 'public' | 'private'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface MoreInfoData {
  ctaButtons?: {
    primary?: {
      label: string
      type: 'download' | 'link' | 'anchor'
      url: string
    }
    secondary?: {
      label: string
      type: 'download' | 'link' | 'anchor'
      url: string
    }
  }
  additionalInfo?: Array<{
    info: string
    detail: string
  }>
  documents?: Array<{
    label: string
    url: string
  }>
}

export interface Property {
  id: string
  created_at: string
  updated_at: string
  name: string
  is_demo: boolean
  template_name: string
  street_address: string
  suburb: string
  state: string
  price: string
  status: 'draft' | 'published' | 'archived'
  sale_type?: 'private_sale' | 'auction'
  auction_datetime?: string
  agency_id: string | null
  agency_name: string | null
  agent_id: string | null
  office_id: string | null
  custom_domain: string | null
  deployment_url: string | null
  maps_address: string | null
  local_timezone: string
  latitude?: number | null
  longitude?: number | null
  footer_links: FooterLink[]
  metadata: {
    template_version: string
    more_info?: MoreInfoData
  }
  template_version: string
  content: PropertyContent
  styling?: {
    textLinks?: {
      hoverEffect: HoverEffectType
    }
    header?: {
      style: HeaderStyleType 
    }
  }
  agency_settings?: {
    branding: {
      logo: {
        dark: string
        light: string
      }
      colors: {
        dark: string
        light: string
        accent: string
      }
      favicon?: string
      typography: {
        bodyFont: {
          url: string
          name: string
        }
        headingFont: {
          url: string
          name: string
        }
      }
    }
    copyright?: string
    menu_items?: {
      features?: string
      lifestyle?: string
      neighbourhood?: string
      viewings?: string
      contact?: string
    }
    office_addresses?: OfficeAddress[]
    footer_links?: FooterLink[]
  }
  assets?: PropertyAssets
  virtual_tour_enabled?: boolean
  ig_enabled?: boolean
  ig_hashtag?: string
}