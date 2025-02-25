'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ParallaxBanner } from './shared/ParallaxBanner'
import { HomeGallery } from './HomeGallery'
import { useFeaturesBanner } from '@/hooks/useFeaturesBanner'
import { useYourHomeImage } from '@/hooks/useYourHomeImage'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from '@/styles/Hero.module.css'
import type { Property } from '@/types/property'

interface YourHomeProps {
  property: Property
}

export function YourHome({ property }: YourHomeProps) {
  const imageRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isFeaturesVisible, setIsFeaturesVisible] = useState(false)
  const { imageUrl: bannerUrl, loading: bannerLoading } = useFeaturesBanner(property.id, property.is_demo)
  const { imageUrl: homeImageUrl, loading: homeImageLoading } = useYourHomeImage(property.id, property.is_demo)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { content } = property
  
  const featuresData = useMemo(() => 
    content.features || { items: [], header: '', headline: '', description: '' }
  , [content.features])

  // Check if virtual tour is enabled
  const showVirtualTour = useMemo(() => {
    return property.virtual_tour_enabled;
  }, [property.virtual_tour_enabled]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsFeaturesVisible(true)
            observer.disconnect()
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (featuresRef.current) {
      observer.observe(featuresRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="relative bg-brand-light">
      <ParallaxBanner
        imageSrc={bannerUrl || '/images/banners/features.jpg'}
        title={featuresData.banner_title || "YOUR HOME"}
        loading={bannerLoading}
      />

      {/* Content Section */}
      <section className="pt-20 pb-20 px-6 sm:px-8 lg:px-12 bg-brand-light">
        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div 
              className="prose prose-lg max-w-none text-brand-dark prose-ul:text-brand-dark prose-li:marker:text-brand-dark transition-all duration-1000"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: `translateY(${isVisible ? '0' : '40px'})`
              }}
            >
              <h3 className="text-3xl font-light mb-6 text-brand-dark">{featuresData.headline}</h3>
              <p className="text-brand-dark mb-8">{featuresData.description || featuresData.header}</p>
              
              {/* Auction Information - Only show for auction properties */}
              {property.sale_type === 'auction' && property.auction_datetime && (
                <>
                  <h4 className="text-2xl font-light mb-2 text-brand-dark">Auction:</h4>
                  <p className="text-brand-dark mb-8">
                    {(() => {
                      try {
                        const auctionDate = new Date(property.auction_datetime);
                        
                        // Check if date is valid
                        if (isNaN(auctionDate.getTime())) {
                          return 'Date to be announced';
                        }
                        
                        // Format day - full name for desktop, 3-letter abbreviation for mobile
                        const dayOptions = { weekday: isMobile ? 'short' : 'long' } as Intl.DateTimeFormatOptions;
                        const day = new Intl.DateTimeFormat('en-US', dayOptions).format(auctionDate);
                        
                        // Format month and date
                        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(auctionDate);
                        const date = auctionDate.getDate();
                        
                        // Format time
                        const hours = auctionDate.getHours();
                        const minutes = auctionDate.getMinutes();
                        const ampm = hours >= 12 ? 'pm' : 'am';
                        const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                        const formattedMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
                        
                        return `${day}, ${month} ${date} at ${formattedHours}${formattedMinutes}${ampm}`;
                      } catch (error) {
                        console.error('Error formatting auction date:', error);
                        return 'Date to be announced';
                      }
                    })()}
                  </p>
                </>
              )}
              
              {/* Virtual Tour Button */}
              {showVirtualTour && (
                <Link
                  href={`/properties/${property.id}/virtual-tour`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.slideEffect} inline-block px-8 py-3 text-brand-light bg-brand-dark active:translate-y-[3px] no-underline hover:no-underline`}
                >
                  View Virtual Tour
                </Link>
              )}
            </div>

            {/* Right Column - Image */}
            <div 
              ref={imageRef}
              className="relative h-[400px] transition-all duration-1000"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: `translateY(${isVisible ? '0' : '40px'})`,
                transitionDelay: '300ms'
              }}
            >
              {homeImageLoading ? (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
              ) : homeImageUrl ? (
                <Image
                  src={homeImageUrl}
                  alt="Your Home Feature"
                  fill
                  className="object-cover rounded-lg shadow-xl"
                  priority
                />
              ) : (
                <Image
                  src="/images/sections/yourhome/yourhome.jpg"
                  alt="Your Home Feature"
                  fill
                  className="object-cover rounded-lg shadow-xl"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative bg-brand-dark isolate">
        {/* Background Image (Blurred) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl -z-10"
          style={{ 
            backgroundImage: `url(${homeImageUrl || '/images/sections/yourhome/yourhome.jpg'})`,
            opacity: 0.5,
            transform: 'scale(1.1)'
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-brand-dark/70 -z-10" />

        {/* Content */}
        <div className="relative px-12 py-16">
          {/* Features Grid */}
          <div ref={featuresRef} className="max-w-7xl mx-auto mb-8">
            <h4 className="text-2xl font-light mb-4 text-brand-light text-center">Home Highlights</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {featuresData.items?.filter(item => item.feature?.trim()).map((feature, index) => (
                <div 
                  key={index}
                  className="[background-color:rgb(var(--brand-light)/0.1)] [border-color:rgb(var(--brand-light)/0.2)] backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-brand-light text-center font-light border inline-block text-sm transition-all duration-800"
                  style={{ 
                    opacity: isFeaturesVisible ? 1 : 0,
                    transform: `translateY(${isFeaturesVisible ? '0' : '20px'})`,
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  {feature.feature}
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="max-w-7xl mx-auto">
            <HomeGallery property={property} />
          </div>
        </div>
      </section>
    </section>
  )
} 