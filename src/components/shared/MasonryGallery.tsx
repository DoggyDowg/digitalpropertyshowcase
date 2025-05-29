'use client'

import { useState, useRef, useEffect } from 'react'
import { DynamicImage } from './DynamicImage'
import { FullscreenGallery } from '../FullscreenGallery'

interface GalleryImage {
  src: string
  alt: string
  aspectRatio?: number
}

interface MasonryGalleryProps {
  images: GalleryImage[]
  columns?: number
  gap?: number
  className?: string
}

export function MasonryGallery({
  images,
  columns = 3,
  gap = 4,
  className = '',
}: MasonryGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (galleryRef.current) {
      observer.observe(galleryRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative">
      {/* Masonry Grid using CSS columns */}
      <div 
        ref={galleryRef}
        className={`${className}`}
        style={{ 
          columnCount: columns,
          columnGap: `${gap * 0.25}rem`,
          columnRule: 'none',
          columns: `${columns} auto`
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.src}
            className={`relative break-inside-avoid-column mb-4 overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:z-10 ${isVisible ? 'gallery-item-fade-in' : 'opacity-0'} group`}
            onClick={() => setSelectedImage(index)}
            style={{ 
              animationDelay: `${Math.floor(index / columns) * 100 + (index % columns) * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <div 
              style={{
                paddingBottom: `${100 / (image.aspectRatio || 1)}%`,
                position: 'relative'
              }}
            >
              <DynamicImage
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Gallery */}
      {selectedImage !== null && (
        <FullscreenGallery
          images={images}
          initialIndex={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
} 