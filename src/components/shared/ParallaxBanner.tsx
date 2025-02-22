'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface ParallaxBannerProps {
  imageSrc: string
  title: string
  loading?: boolean
}

export function ParallaxBanner({ imageSrc, title, loading = false }: ParallaxBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const scrollListenerRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number | null>(null)

  // Initialize parallax effect
  useEffect(() => {
    if (!bannerRef.current || !imageRef.current) return

    const banner = bannerRef.current
    const image = imageRef.current

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const rect = banner.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        
        // Calculate the scroll position relative to when the banner enters/leaves the viewport
        const scrollProgress = (rect.top + rect.height) / (viewportHeight + rect.height)
        
        // Adjust the range of movement to ensure image coverage
        const parallaxRange = rect.height * 0.5 // 50% of banner height for movement
        const parallaxOffset = scrollProgress * parallaxRange
        
        // Use translate3d for better performance
        image.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`
      })
    }

    // Initial position calculation
    handleScroll()

    // Add scroll listener
    document.addEventListener('scroll', handleScroll, { passive: true })

    // Store the handler for cleanup
    scrollListenerRef.current = handleScroll

    return () => {
      if (scrollListenerRef.current) {
        document.removeEventListener('scroll', scrollListenerRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={bannerRef} 
      className="relative h-[160px] w-full overflow-hidden bg-brand-dark"
    >
      <div className="absolute inset-0">
        {/* Image container - Made significantly taller for better coverage */}
        <div 
          ref={imageRef} 
          className="absolute inset-0 h-[calc(100%+240px)] -top-[120px] will-change-transform"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {loading ? (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          ) : (
            <Image
              src={imageSrc}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
              onError={(e) => {
                console.error('Failed to load banner image:', imageSrc, e)
              }}
            />
          )}
        </div>
        {/* Overlay - reduced opacity for better visibility */}
        <div className="absolute inset-0 z-10 bg-black/40" />
      </div>
      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-center z-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-brand-light tracking-wider">
          {title}
        </h2>
      </div>
    </div>
  )
}