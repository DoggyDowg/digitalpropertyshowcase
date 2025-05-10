'use client'

import { useState, useRef, useEffect } from 'react'
import { ParallaxBanner } from './shared/ParallaxBanner'
import { MasonryGallery } from './shared/MasonryGallery'
import SocialShare from './shared/SocialShare'
import { useLifestyleBanner } from '@/hooks/useLifestyleBanner'
import { useGalleryImages } from '@/hooks/useGalleryImages'
import { useFooterImage } from '@/hooks/useFooterImage'
import type { Property } from '@/types/property'

interface YourLifestyleProps {
  property: Property
}

export function YourLifestyle({ property }: YourLifestyleProps) {
  const { imageUrl, loading } = useLifestyleBanner(property.id, property.is_demo)
  const { images, loading: galleryLoading } = useGalleryImages(property.id, property.is_demo)
  const { imageUrl: footerImageUrl } = useFooterImage(property.id, property.is_demo)
  const bannerTitle = property.content?.lifestyle?.banner_title || 'YOUR LIFESTYLE'
  const headline = property.content?.lifestyle?.headline || 'Your Lifestyle'
  const description = property.content?.lifestyle?.description || ''

  // Scroll state management
  const galleryRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(true) // Start with bottom fade visible

  // Check scroll position with debounce
  const handleScroll = () => {
    if (!galleryRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = galleryRef.current
    const isAtTop = scrollTop <= 5
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 5

    setShowTopFade(!isAtTop)
    setShowBottomFade(!isAtBottom)
  }

  // Initial check and setup scroll listener
  useEffect(() => {
    const gallery = galleryRef.current
    if (gallery) {
      handleScroll() // Initial check
      gallery.addEventListener('scroll', handleScroll, { passive: true })
      return () => gallery.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Check scroll indicators when images load or change
  useEffect(() => {
    if (images?.length) {
      // Short delay to allow images to affect scroll height
      const timer = setTimeout(handleScroll, 100)
      return () => clearTimeout(timer)
    }
  }, [images])

  // Debug logs
  useEffect(() => {
    // console.log('Property suburb:', property.suburb)
    // console.log('Hashtags:', ['RealEstate', property.suburb?.replace(/\s+/g, '') || 'DreamHome'])
  }, [property.suburb])

  // Debug logs for social share props
  useEffect(() => {
    // console.log('=== YourLifestyle Props to SocialShare ===');
    // console.log('Property Name:', property.name);
    // console.log('Property Suburb:', property.suburb);
    // console.log('Property OG Description:', property.content?.og?.description);
    // console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : '');
    // console.log('Footer Image:', footerImageUrl);
    // console.log('========================================');
  }, [property.name, property.suburb, property.content?.og?.description, footerImageUrl]);

  return (
    <div className="flex flex-col overflow-x-hidden">
      <div id="lifestyle">
        <ParallaxBanner
          imageSrc={imageUrl || '/images/banners/yourlifestyle.jpg'}
          title={bannerTitle}
          loading={loading}
        />
      </div>

      {/* Content Section */}
      <section className="py-12 px-6 sm:px-8 lg:px-12 bg-brand-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-8">
            {/* Gallery Grid */}
            <div className="relative">
              {/* Top Fade - Outside scroll container */}
              <div 
                className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-brand-light via-brand-light/90 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${
                  showTopFade ? 'opacity-100' : 'opacity-0'
                }`}
              />
              
              {/* Gallery Container */}
              <div 
                ref={galleryRef}
                className="h-[450px] overflow-y-auto scrollbar-thin relative"
                onScroll={handleScroll}
              >
                {galleryLoading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
                ) : (
                  <MasonryGallery
                    images={images || []}
                    columns={2}
                    gap={4}
                  />
                )}

                {/* Bottom Fade */}
                <div 
                  className={`sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-brand-light via-brand-light/90 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${
                    showBottomFade ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </div>

            {/* Lifestyle Description and Share */}
            <div className="flex flex-col gap-8">
              <div className="prose prose-lg max-w-none text-brand-dark prose-ul:text-brand-dark prose-li:marker:text-brand-dark">
                <h2 className="text-3xl font-semibold mb-6 text-brand-dark">{headline}</h2>
                <p>{description}</p>
              </div>
              
              {/* Social Share Component */}
              <div className="flex justify-start items-center pt-4">
                <SocialShare 
                  title={property.name}
                  description={`This beautiful home in ${property.suburb || 'this location'} features ${property.content?.og?.description || 'amazing features and lifestyle options'}`}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  image={footerImageUrl || ''}
                  hashtags={['RealEstate', property.suburb?.replace(/\s+/g, '') || 'DreamHome']}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 