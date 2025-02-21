'use client'

import { ClientLayout } from '@/components/layouts/ClientLayout'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { TransitionGallery } from './components/TransitionGallery'
import { YourHome } from './components/YourHome'
import { YourLifestyle } from './components/YourLifestyle'
import { YourNeighbourhood } from './components/YourNeighbourhood'
import { MoreInfo } from './components/MoreInfo'
import { Viewings } from './components/Viewings'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import CustomChat from '@/components/shared/CustomChat'
import { GridGallery } from './components/ScrollerTransition'
import type { Property } from '@/types/property'

interface DubaiTemplateProps {
  property: Property
}

export function DubaiTemplate({ property }: DubaiTemplateProps) {
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <ClientLayout property={property}>
      <main className="min-h-screen">
        <div className="dubai-template overflow-x-hidden">
          <Header property={property} />
          <Hero property={property} />
          <GridGallery propertyId={property.id} />
          <TransitionGallery property={property} />
          <YourHome property={property} />
          <YourLifestyle property={property} />
          <YourNeighbourhood property={property} />
          <MoreInfo property={property} />
          <Viewings property={property} />
          <Contact property={property} />
          <Footer property={property} />
          {property.is_demo && <CustomChat />}
        </div>
      </main>
    </ClientLayout>
  )
} 