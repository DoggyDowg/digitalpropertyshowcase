'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getImageWithFallback } from '@/utils/imageUtils'

interface DynamicImageProps {
  src: string          // Base path without extension (e.g., '/images/gallery/photo1')
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
}

export function DynamicImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
}: DynamicImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Check if the URL is a Supabase URL
  const isSupabaseUrl = src.includes('supabase.co') || src.includes('supabase.in')
  const srcSet = isSupabaseUrl ? [src] : getImageWithFallback(src)
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0)

  useEffect(() => {
    console.log(`DynamicImage: Loading image from ${srcSet[currentSrcIndex]}`)
  }, [srcSet, currentSrcIndex])

  const handleError = () => {
    console.error(`DynamicImage: Error loading image from ${srcSet[currentSrcIndex]}`)
    if (currentSrcIndex < srcSet.length - 1) {
      setCurrentSrcIndex(prev => prev + 1)
    } else {
      console.error(`DynamicImage: All fallbacks failed for ${alt}`)
      setError(true)
    }
  }

  const handleLoad = () => {
    console.log(`DynamicImage: Successfully loaded image from ${srcSet[currentSrcIndex]}`)
    setLoaded(true)
  }

  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? { position: 'relative', width: '100%', height: '100%' } : { width, height }}
      >
        <span className="text-gray-400 text-sm">Image not found</span>
      </div>
    )
  }

  return (
    <Image
      src={srcSet[currentSrcIndex]}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      priority={priority}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
} 