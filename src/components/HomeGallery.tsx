'use client'

import { MarqueeGallery } from './MarqueeGallery'
import type { Property } from '@/types/property'

interface HomeGalleryProps {
  property: Property
}

export function HomeGallery({ property }: HomeGalleryProps) {
  return <MarqueeGallery property={property} />
} 