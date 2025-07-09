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
  onLoad?: () => void
}

export function RobustImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes = '100vw',
  onLoad
}: RobustImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const hasRegisteredAsset = useRef(false)
  const isSupabaseUrl = src.includes('supabase.co') || src.includes('supabase.in')
  const imageRef = useRef<HTMLImageElement>(null)
  const lastUrlRef = useRef<string>(src)
  const [isVisible, setIsVisible] = useState(false)

  // Verify image URL on mount and changes
  useEffect(() => {
    if (!src) {
      setError(true)
      return
    }

    // Skip verification if URL hasn't changed (ignoring cache busting)
    const baseUrl = src.split('?')[0]
    const lastBaseUrl = lastUrlRef.current.split('?')[0]
    if (baseUrl === lastBaseUrl) {
      return
    }

    lastUrlRef.current = src

    // Verify the URL is valid
    const verifyImage = async () => {
      try {
        const response = await fetch(src, { method: 'HEAD' })
        if (!response.ok) {
          console.error('[RobustImage] Image URL verification failed:', response.status, response.statusText)
          setError(true)
          if (hasRegisteredAsset.current) {
            markAssetAsLoaded()
          }
        }
      } catch (err) {
        console.error('[RobustImage] Error verifying image URL:', err)
        setError(true)
        if (hasRegisteredAsset.current) {
          markAssetAsLoaded()
        }
      }
    }

    verifyImage()
  }, [src, markAssetAsLoaded])

  // Register the image as an asset to load
  useEffect(() => {
    const baseUrl = src.split('?')[0]
    if (baseUrl && !hasRegisteredAsset.current) {
      // Only log if it's a critical asset or there's an issue
      hasRegisteredAsset.current = true
      registerAsset()
    }

    // Reset states when base image URL changes
    return () => {
      const newBaseUrl = src.split('?')[0]
      const lastBaseUrl = lastUrlRef.current.split('?')[0]
      if (newBaseUrl !== lastBaseUrl) {
        setIsLoaded(false)
        setError(false)
        hasRegisteredAsset.current = false
      }
    }
  }, [src, registerAsset, isSupabaseUrl, fill, width, height, priority])

  const handleLoad = () => {
    // Only log critical assets or first few loads
    setIsLoaded(true)
    if (hasRegisteredAsset.current) {
      markAssetAsLoaded()
    }
    setError(false)
    onLoad?.()
  }

  const handleError = () => {
    console.error('❌ [RobustImage] Failed to load:', { 
      src,
      naturalWidth: imageRef.current?.naturalWidth,
      naturalHeight: imageRef.current?.naturalHeight
    })
    setError(true)
    if (hasRegisteredAsset.current) {
      markAssetAsLoaded() // Mark as loaded even on error to prevent hanging
    }
  }

  // Add cache busting for Supabase URLs, but maintain the same timestamp within component lifecycle
  const cacheBuster = useRef<string>(`?t=${Date.now()}`)
  const imageSrc = isSupabaseUrl ? `${src.split('?')[0]}${cacheBuster.current}` : src

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