'use client'

import { TransitionGallery } from './TransitionGallery'
import { InstagramGallery } from './InstagramGallery'
import type { Property } from '@/types/property'

interface GallerySectionProps {
  property: Property
}

export function GallerySection({ property }: GallerySectionProps) {
  // Render InstagramGallery if Instagram integration is enabled, otherwise render TransitionGallery
  if (property.ig_enabled) {
    return <InstagramGallery property={property} />
  }

  return <TransitionGallery property={property} />
} 