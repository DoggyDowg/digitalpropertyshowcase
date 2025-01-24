'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useGalleryImages } from '@/hooks/useGalleryImages'
import { FullscreenGallery } from './FullscreenGallery'
import styles from '@/styles/TransitionGallery.module.css'
import type { Property } from '@/types/property'

const socialLinks = [
  {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    label: 'Facebook',
    shareUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    label: 'Twitter',
    shareUrl: (url: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
  },
  {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    label: 'LinkedIn',
    shareUrl: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
]

interface TransitionGalleryProps {
  property: Property
}

export function TransitionGallery({ property }: TransitionGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { ref: sectionRef, inView } = useInView({
    threshold: 0.15,
    triggerOnce: true,
    rootMargin: '-50px 0px'
  })
  const { images, loading, error } = useGalleryImages(property.id)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Add debugging logs
  useEffect(() => {
    console.log('TransitionGallery - Loading:', loading)
    console.log('TransitionGallery - Images:', images)
    console.log('TransitionGallery - Error:', error)
    console.log('TransitionGallery - InView:', inView)
  }, [loading, images, error, inView])

  // Scroll the gallery left or right
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const itemWidth = container.firstElementChild?.clientWidth || 0
    const gap = 16 // gap-4 = 1rem = 16px
    const scrollAmount = itemWidth + gap

    let newScroll = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    // Handle endless scrolling
    if (direction === 'left' && newScroll < 0) {
      newScroll = container.scrollWidth - container.clientWidth
    } else if (direction === 'right' && newScroll + container.clientWidth > container.scrollWidth) {
      newScroll = 0
    }

    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }

  const handleShare = (shareUrl: (url: string) => string, label: string) => {
    const url = window.location.href
    
    // Open share dialog in a new window
    const width = 600
    const height = 400
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    window.open(
      shareUrl(url),
      `Share on ${label}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    )
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseFullscreen = () => {
    setSelectedImageIndex(null)
  }

  // Show loading state
  if (loading) {
    return (
      <section className="relative py-16 bg-brand-dark">
        <div className="relative w-full overflow-hidden px-6 sm:px-8 lg:px-12">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 mx-auto max-w-[1400px]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className={styles.imageContainer}>
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    console.error('Gallery Error:', error)
    return null
  }

  // Show empty state
  if (!loading && (!images || images.length === 0)) {
    console.log('No images to display')
    return null
  }

  return (
    <>
      <section ref={sectionRef} className="relative py-16 bg-brand-dark">
        <div className="relative w-full overflow-hidden px-6 sm:px-8 lg:px-12">
          {/* Left Chevron */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-brand-light hover:bg-brand-light/90 text-brand-dark w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Images */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-2 px-1 mx-auto max-w-[1400px]"
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 cursor-pointer"
                style={{ 
                  opacity: inView ? 1 : 0,
                  transform: `translateY(${inView ? '0' : '40px'})`,
                  transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: `${index * 300}ms`
                }}
                onClick={() => handleImageClick(index)}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover rounded-lg shadow-lg"
                    priority={index < 4}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right Chevron */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-brand-light hover:bg-brand-light/90 text-brand-dark w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Social Share */}
        <div className="flex justify-center items-center gap-4 mt-12">
          <span className="text-brand-light pr-1 text-lg">Share:</span>
          {socialLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleShare(link.shareUrl, link.label)}
              className="text-brand-light hover:text-brand-light/80 transition-colors"
              aria-label={`Share on ${link.label}`}
            >
              <link.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </section>

      {/* Fullscreen Gallery */}
      {selectedImageIndex !== null && (
        <FullscreenGallery
          images={images}
          initialIndex={selectedImageIndex}
          onClose={handleCloseFullscreen}
        />
      )}
    </>
  )
} 