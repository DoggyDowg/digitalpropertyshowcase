'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'

interface RobustImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
}

export function RobustImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes = '100vw'
}: RobustImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const hasRegisteredAsset = useRef(false)
  const isSupabaseUrl = src.includes('supabase.co') || src.includes('supabase.in')
  const imageRef = useRef<HTMLImageElement>(null)

  // Register the image as an asset to load
  useEffect(() => {
    if (src && !hasRegisteredAsset.current) {
      console.log('[RobustImage] Registering asset:', { 
        src,
        isSupabaseUrl,
        fill,
        width,
        height,
        priority 
      })
      hasRegisteredAsset.current = true
      registerAsset()
    }

    // Reset states when image source changes
    return () => {
      if (src) {
        console.log('[RobustImage] Cleaning up for:', { src })
        setIsLoaded(false)
        setError(false)
        hasRegisteredAsset.current = false
      }
    }
  }, [src, registerAsset, isSupabaseUrl, fill, width, height, priority])

  const handleLoad = () => {
    console.log('[RobustImage] Image loaded:', { 
      src, 
      hasRegistered: hasRegisteredAsset.current,
      naturalWidth: imageRef.current?.naturalWidth,
      naturalHeight: imageRef.current?.naturalHeight
    })
    setIsLoaded(true)
    if (hasRegisteredAsset.current) {
      markAssetAsLoaded()
    }
  }

  const handleError = () => {
    console.log('[RobustImage] Image error:', { src })
    setError(true)
    if (hasRegisteredAsset.current) {
      markAssetAsLoaded() // Mark as loaded even on error to prevent hanging
    }
  }

  // Add cache busting for Supabase URLs
  const imageSrc = isSupabaseUrl ? `${src}?t=${Date.now()}` : src

  return (
    <div className="relative w-full h-full">
      <Image
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        priority={priority || isSupabaseUrl}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
} 