'use client'

import { useEffect } from 'react'
import { BrandColorInitializer } from '@/components/BrandColorInitializer'
import { BrandFontInitializer } from '@/components/BrandFontInitializer'
import { AssetLoadingProvider } from '@/contexts/AssetLoadingContext'
import { PropertyProvider } from '@/contexts/PropertyContext'
import LoadingScreen from '@/components/shared/LoadingScreen'
import { BackgroundVideo } from '@/components/shared/BackgroundVideo'
import type { Property } from '@/types/property'

interface ClientLayoutProps {
  property: Property
  children: React.ReactNode
}

export function ClientLayout({ property, children }: ClientLayoutProps) {
  /* useEffect(() => {
    console.log('ClientLayout mounted with property:', property);
  }, [property]); */

  return (
    <AssetLoadingProvider>
      <PropertyProvider initialProperty={property}>
        {property.is_demo && <LoadingScreen />}
        <BrandColorInitializer property={property} />
        <BrandFontInitializer property={property} />
        <BackgroundVideo property={property} />
        {children}
      </PropertyProvider>
    </AssetLoadingProvider>
  )
}