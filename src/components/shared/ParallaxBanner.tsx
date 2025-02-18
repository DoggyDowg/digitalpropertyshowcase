'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'

interface ParallaxBannerProps {
  imageSrc: string
  title: string
  loading?: boolean
}

export function ParallaxBanner({ imageSrc, title, loading = false }: ParallaxBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const scrollListenerRef = useRef<(() => void) | null>(null)
  const hasRegisteredAsset = useRef(false)

  // Register this banner's image as an asset to load
  useEffect(() => {
    if (!loading && imageSrc && !hasRegisteredAsset.current) {
      console.log('[ParallaxBanner] Registering asset:', { imageSrc })
      hasRegisteredAsset.current = true
      registerAsset()
    }
  }, [loading, imageSrc, registerAsset])

  // Reset states when image source changes
  useEffect(() => {
    console.log('[ParallaxBanner] Image source changed, resetting states:', { imageSrc })
    setIsImageLoaded(false)
    setIsInitialized(false)
    hasRegisteredAsset.current = false
  }, [imageSrc])

  // Initialize parallax effect
  useEffect(() => {
    if (!bannerRef.current || !imageRef.current || !isImageLoaded) {
      console.log('[ParallaxBanner] Waiting for initialization...', {
        hasBannerRef: !!bannerRef.current,
        hasImageRef: !!imageRef.current,
        isImageLoaded,
        imageSrc
      })
      return
    }

    console.log('[ParallaxBanner] Initializing parallax effect:', { imageSrc })
    setIsInitialized(true)
  }, [isImageLoaded, imageSrc])

  // Handle scroll effects
  useEffect(() => {
    if (!isInitialized) {
      console.log('[ParallaxBanner] Not initialized yet, skipping scroll handler setup:', { imageSrc })
      return
    }

    const banner = bannerRef.current
    const image = imageRef.current
    if (!banner || !image) {
      console.error('[ParallaxBanner] Missing refs after initialization:', { imageSrc })
      return
    }

    console.log('[ParallaxBanner] Setting up scroll handler:', { imageSrc })
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const rect = banner.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        
        // Only apply parallax when banner is in extended viewport
        if (rect.top < viewportHeight + 200 && rect.bottom > -200) {
          const distanceFromCenter = rect.top - (viewportHeight / 2)
          const parallaxOffset = Math.min(Math.max(distanceFromCenter * 0.2, -150), 150)
          image.style.transform = `translateY(${parallaxOffset}px)`
        }
      })
    }

    // Store the handler reference for cleanup
    scrollListenerRef.current = handleScroll

    // Initial position
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      console.log('[ParallaxBanner] Cleaning up scroll handler:', { imageSrc })
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current)
        scrollListenerRef.current = null
      }
    }
  }, [isInitialized, imageSrc])

  const handleImageLoad = () => {
    console.log('[ParallaxBanner] Image loaded:', { imageSrc, hasRegistered: hasRegisteredAsset.current })
    setIsImageLoaded(true)
    if (hasRegisteredAsset.current) {
      markAssetAsLoaded()
    }
  }

  return (
    <div ref={bannerRef} className="relative h-[160px] w-full overflow-hidden bg-brand-dark">
      {loading ? (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      ) : (
        <div className="absolute inset-0">
          {/* Image container */}
          <div 
            ref={imageRef} 
            className="absolute -top-[150px] left-0 right-0 h-[460px] overflow-hidden z-0"
          >
            <Image
              src={imageSrc}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              onLoad={handleImageLoad}
            />
          </div>
          {/* Overlay */}
          <div 
            className="absolute inset-0 z-10" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />
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