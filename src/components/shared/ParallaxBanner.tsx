'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface ParallaxBannerProps {
  imageSrc: string
  title: string
  loading?: boolean
}

export function ParallaxBanner({ imageSrc, title, loading = false }: ParallaxBannerProps) {
  console.log('=== PARALLAX BANNER PROPS ===')
  console.log('imageSrc:', imageSrc)
  console.log('title:', title)
  console.log('loading:', loading)
  console.log('==========================')

  const bannerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const scrollListenerRef = useRef<(() => void) | null>(null)

  // Initialize parallax effect
  useEffect(() => {
    if (!bannerRef.current || !imageRef.current) return

    const banner = bannerRef.current
    const image = imageRef.current

    const handleScroll = () => {
      requestAnimationFrame(() => {
        const rect = banner.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        
        if (rect.top < viewportHeight + 200 && rect.bottom > -200) {
          const scrollProgress = (rect.top + rect.height) / (viewportHeight + rect.height)
          const parallaxOffset = Math.min(Math.max((0.5 - scrollProgress) * 100, -50), 50)
          image.style.transform = `translateY(${parallaxOffset}px)`
        }
      })
    }

    scrollListenerRef.current = handleScroll
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current)
        scrollListenerRef.current = null
      }
    }
  }, [])

  return (
    <div ref={bannerRef} className="relative h-[160px] w-full overflow-hidden bg-brand-dark">
      {loading ? (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      ) : (
        <div className="absolute inset-0">
          {/* Image container */}
          <div 
            ref={imageRef} 
            className="absolute inset-0 h-[calc(100%+100px)] -top-[50px] overflow-hidden z-0"
          >
            <Image
              src={imageSrc}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center center' }}
              onError={(e) => {
                console.error('Failed to load banner image:', imageSrc, e)
              }}
            />
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 z-10 bg-black/50" />
        </div>
      )}
      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-center z-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-brand-light tracking-wider">
          {title}
        </h2>
      </div>
    </div>
  )
}