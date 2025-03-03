'use client'

import { Header } from '@/components/Header'
import { Hero as CuscoHero } from '@/components/Hero'
import { Hero as DubaiHero } from '@/templates/dubai/components/Hero'
import { YourHome } from '@/components/YourHome'
import { YourLifestyle } from '@/components/YourLifestyle'
import { YourNeighbourhood } from '@/components/YourNeighbourhood'
import { Viewings } from '@/components/Viewings'
import { Footer } from '@/components/Footer'
import { GallerySection } from '@/components/GallerySection'
import { MoreInfo } from '@/components/MoreInfo'
import { ClientLayout } from '@/components/layouts/ClientLayout'
import { Contact } from '@/components/Contact'
import CustomChat from '@/components/shared/CustomChat'
import type { Property } from '@/types/property'

interface CuscoTemplateProps {
  property: Property
  templateStyle?: 'cusco' | 'dubai'
}

export function CuscoTemplate({ property, templateStyle = 'cusco' }: CuscoTemplateProps) {
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

  const HeroComponent = templateStyle === 'dubai' ? DubaiHero : CuscoHero

  return (
    <ClientLayout property={property}>
      <main className="min-h-screen overflow-x-hidden">
        <Header property={property} />
        <HeroComponent property={property} />
        <GallerySection property={property} />
        <YourHome property={property} />
        <YourLifestyle property={property} />
        <YourNeighbourhood property={property} />
        <MoreInfo property={property} />
        <Viewings property={property} />
        <Contact property={property} />
        <Footer property={property} />
        {property.is_demo && <CustomChat />}
      </main>
    </ClientLayout>
  )
}