'use client'

import { useState } from 'react'
import { useGalleryImages } from '@/hooks/useGalleryImages'
import { FullscreenGallery } from './FullscreenGallery'
import type { Property } from '@/types/property'
import Image from 'next/image'
import Marquee from './ui/marquee'

interface MarqueeGalleryProps {
  property: Property
}

export function MarqueeGallery({ property }: MarqueeGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { images, loading } = useGalleryImages(property.id, property.is_demo)

  // Loading state with proper skeleton UI
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden px-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-none w-72 h-48 bg-gray-200 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No gallery images available</p>
      </div>
    )
  }

  return (
    <>
      <Marquee pauseOnHover={true} className="[--duration:40s]">
        {images.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-none w-72 relative cursor-pointer mx-2"
            onClick={() => setSelectedImageIndex(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative h-48 overflow-hidden rounded-lg">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 288px"
                className={`object-cover transition-transform duration-300 ${
                  hoveredIndex === index ? 'scale-110' : 'scale-100'
                }`}
                priority={index < 4} // Prioritize loading first 4 images
                loading={index < 4 ? 'eager' : 'lazy'}
              />
              <div 
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                  hoveredIndex === index ? 'opacity-30' : 'opacity-0'
                }`} 
              />
            </div>
          </div>
        ))}
      </Marquee>

      {/* Fullscreen Gallery */}
      {selectedImageIndex !== null && (
        <FullscreenGallery
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  )
} 