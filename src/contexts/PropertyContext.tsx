'use client'

import { createContext, useState, useContext, ReactNode, useEffect } from 'react'
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

export function PropertyProvider({ children, initialProperty }: PropertyProviderProps) {
  const [property, setProperty] = useState<Property>(initialProperty)

  // Debug logging to verify property data
  useEffect(() => {
    console.log('PropertyProvider initialized with:', {
      propertyId: initialProperty.id,
      styling: initialProperty.styling,
      headerStyle: initialProperty.styling?.header?.style,
      textLinksEffect: initialProperty.styling?.textLinks?.hoverEffect
    })
  }, [initialProperty])

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