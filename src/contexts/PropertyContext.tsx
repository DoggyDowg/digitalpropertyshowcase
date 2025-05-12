'use client'

import { createContext, useState, useContext, ReactNode } from 'react'
import type { Property } from '@/types/property'

interface PropertyContextValue {
  property: Property | null
  setProperty: (property: Property) => void
}

export const PropertyContext = createContext<PropertyContextValue | null>(null)

interface PropertyProviderProps {
  children: ReactNode
  initialProperty: Property
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children, initialProperty }) => {
  const [property, setProperty] = useState<Property>(initialProperty)

  // console.log('PropertyProvider initialized with:', initialProperty)

  /* Implementation was commented out, keeping for reference
  useEffect(() => {
    console.log('PropertyProvider initialized with:', {
      propertyId: initialProperty.id,
      hasStyling: !!initialProperty.styling,
      hasAgencySettings: !!initialProperty.agency_settings,
      isDemo: initialProperty.is_demo
    })
  }, [initialProperty]) */

  return (
    <PropertyContext.Provider value={{ property, setProperty }}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const context = useContext(PropertyContext)
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider')
  }
  return context
} 