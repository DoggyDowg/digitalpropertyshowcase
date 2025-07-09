'use client'

import { useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'

interface TrackedImageProps extends Omit<ImageProps, 'onLoad'> {
  onLoadingComplete?: (img: HTMLImageElement) => void
}

interface TrackedVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  onLoadingComplete?: () => void
}

export function TrackedImage({ onLoadingComplete, src, alt, ...props }: TrackedImageProps) {
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const isRegistered = useRef(false)

  useEffect(() => {
    if (!isRegistered.current) {
      // Silent registration - only log if there are issues
      registerAsset()
      isRegistered.current = true
    }
  }, [registerAsset, src])

  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      onLoadingComplete={(img) => {
        // Silent success - only log errors
        markAssetAsLoaded()
        onLoadingComplete?.(img)
      }}
      onError={() => {
        console.error(`❌ [TrackedImage] Failed to load: ${src}`)
        markAssetAsLoaded() // Mark as loaded even on error to prevent hanging
      }}
    />
  )
}

export function TrackedVideo({ onLoadingComplete, src, ...props }: TrackedVideoProps) {
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const isRegistered = useRef(false)

  useEffect(() => {
    if (!isRegistered.current) {
      // Silent registration - only log if there are issues
      registerAsset()
      isRegistered.current = true
    }
  }, [registerAsset, src])

  return (
    <video
      {...props}
      src={src}
      onLoadedData={() => {
        // Silent success - only log errors
        markAssetAsLoaded()
        onLoadingComplete?.()
      }}
      onError={() => {
        console.error(`❌ [TrackedVideo] Failed to load: ${src}`)
        markAssetAsLoaded() // Mark as loaded even on error to prevent hanging
      }}
    />
  )
} 