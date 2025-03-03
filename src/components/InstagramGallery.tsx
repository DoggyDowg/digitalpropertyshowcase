'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import type { Property } from '@/types/property'
import { useAssetLoading } from '@/contexts/AssetLoadingContext'
import { TransitionGallery } from './TransitionGallery'

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption: string
  timestamp: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  thumbnail_url?: string
  children?: {
    data: Array<{
      id: string
      media_type: string
      media_url: string
      thumbnail_url?: string
    }>
  }
}

interface InstagramGalleryProps {
  property: Property
}

function VideoThumbnail({ post }: { post: InstagramPost }) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false)

  useEffect(() => {
    if (!videoRef) return;

    if (isHovered) {
      videoRef.play().catch(() => console.log('Preview autoplay prevented'))
    } else if (hasVideoLoaded) {
      videoRef.pause()
      videoRef.currentTime = 0
    }
  }, [isHovered, hasVideoLoaded, videoRef])

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fallback Background */}
      <div className="absolute inset-0 bg-gray-800" />
      
      {/* Video Element (used for both preview and thumbnail) */}
      <video
        ref={setVideoRef}
        src={post.media_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        onLoadedData={() => {
          setIsVideoLoading(false)
          setHasVideoLoaded(true)
          if (videoRef) {
            // Set to first frame for thumbnail
            videoRef.currentTime = 0
          }
        }}
        onError={() => {
          setIsVideoLoading(false)
          console.error('Failed to load video:', post.media_url)
        }}
      />

      {/* Loading Indicator */}
      {isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button (only show when not loading and not hovered) */}
      {!isHovered && !isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* White circle background */}
            <div className="absolute inset-0 bg-white/20 rounded-full -m-2" />
            <svg 
              className="w-12 h-12 text-white relative"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-white text-sm font-medium">
          View on Instagram
        </span>
      </div>
    </div>
  )
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch Instagram posts')
  }
  return res.json()
}

export function InstagramGallery({ property }: InstagramGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { registerAsset, markAssetAsLoaded } = useAssetLoading()
  const [canScroll, setCanScroll] = useState(false)
  
  const { data: posts, error, isLoading } = useSWR<InstagramPost[]>(
    property.ig_enabled && property.ig_hashtag
      ? `/api/instagram/hashtag-posts?hashtag=${encodeURIComponent(property.ig_hashtag)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 300000,
      onSuccess: (data: InstagramPost[]) => {
        if (Array.isArray(data)) {
          data.forEach(() => registerAsset())
        }
      }
    }
  )

  // Check if scrolling is possible whenever the container or posts change
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        setCanScroll(container.scrollWidth > container.clientWidth)
      }
    }

    checkScrollable()
    // Add resize listener to recheck on window resize
    window.addEventListener('resize', checkScrollable)
    return () => window.removeEventListener('resize', checkScrollable)
  }, [posts])

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

  if (isLoading) {
    return (
      <section className="relative py-16 bg-brand-dark">
        <div className="relative w-full overflow-hidden px-6 sm:px-8 lg:px-12">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 mx-auto max-w-[1400px]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="aspect-square bg-gray-800 animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Show TransitionGallery if we have no posts to display
  if (!posts || posts.length === 0 || error) {
    return <TransitionGallery property={property} />
  }

  return (
    <section className="relative py-16 bg-brand-dark">
      <div className="relative w-full overflow-hidden px-6 sm:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-brand-light text-2xl md:text-3xl font-light mb-8 text-center">
            #{property.ig_hashtag}
          </h2>

          <div className="relative">
            {/* Left Chevron */}
            <button
              onClick={() => canScroll && scroll('left')}
              className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-brand-light hover:bg-brand-light/90 text-brand-dark w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                !canScroll ? 'opacity-20 cursor-not-allowed hover:bg-brand-light' : ''
              }`}
              aria-label="Scroll left"
              aria-disabled={!canScroll}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Images */}
            <div
              ref={scrollContainerRef}
              className="flex justify-center gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth py-2 px-1"
            >
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 max-w-[calc(100%-2rem)] sm:max-w-[calc(50%-1rem)] md:max-w-[calc(33.333%-1rem)] lg:max-w-[calc(25%-1rem)] block aspect-square relative overflow-hidden rounded-lg group transform transition-all duration-300 hover:scale-[1.02] hover:z-10"
                >
                  <div className="absolute inset-0 bg-gray-900/20" />
                  
                  {post.media_type === 'VIDEO' ? (
                    <VideoThumbnail post={post} />
                  ) : (
                    <Image
                      src={post.media_url}
                      alt="Instagram post"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      onLoad={() => markAssetAsLoaded()}
                      onError={(e) => {
                        console.error('Failed to load image:', post.media_url)
                        markAssetAsLoaded()
                        const target = e.target as HTMLImageElement
                        target.parentElement?.classList.add('bg-gray-800')
                      }}
                    />
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      View on Instagram
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Right Chevron */}
            <button
              onClick={() => canScroll && scroll('right')}
              className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-brand-light hover:bg-brand-light/90 text-brand-dark w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                !canScroll ? 'opacity-20 cursor-not-allowed hover:bg-brand-light' : ''
              }`}
              aria-label="Scroll right"
              aria-disabled={!canScroll}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 