'use client'

import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useAerialImages } from '@/hooks/useAerialImages'
import { FullscreenGallery } from './FullscreenGallery'
import type { Property } from '@/types/property'

interface AerialGalleryProps {
  property: Property
}

export function AerialGallery({ property }: AerialGalleryProps) {
  const { images, loading } = useAerialImages(property.id)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const { ref: sectionRef, inView } = useInView({
    threshold: 0.15,
    triggerOnce: true,
    rootMargin: '-50px 0px'
  })

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 auto-rows-auto justify-items-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[300px] h-[200px] bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!images.length) {
    return null
  }

  return (
    <>
      <div className="flex justify-center" ref={sectionRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 auto-rows-auto justify-items-center">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative h-[200px] w-[300px] cursor-pointer group"
              onClick={() => setSelectedImageIndex(index)}
              style={{ 
                opacity: inView ? 1 : 0,
                transform: `translateY(${inView ? '0' : '40px'})`,
                transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: `${index * 200}ms`,
                willChange: 'transform, opacity'
              }}
            >
              <Image
                src={imageUrl}
                alt={`Aerial view ${index + 1}`}
                fill
                className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/20 transition-colors duration-300 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {selectedImageIndex !== null && (
        <FullscreenGallery
          images={images.map((url, index) => ({
            src: url,
            alt: `Aerial view ${index + 1}`
          }))}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  )
}