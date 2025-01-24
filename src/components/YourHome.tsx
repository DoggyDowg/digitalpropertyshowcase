'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ParallaxBanner } from './shared/ParallaxBanner'
import { HomeGallery } from './HomeGallery'
import { useFeaturesBanner } from '@/hooks/useFeaturesBanner'
import { useYourHomeImage } from '@/hooks/useYourHomeImage'
import type { Property } from '@/types/property'

interface YourHomeProps {
  property: Property
}

export function YourHome({ property }: YourHomeProps) {
  const imageRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isFeaturesVisible, setIsFeaturesVisible] = useState(false)
  const { imageUrl: bannerUrl, loading: bannerLoading } = useFeaturesBanner(property.id)
  const { imageUrl: homeImageUrl, loading: homeImageLoading } = useYourHomeImage(property.id)

  // Use the property data from Supabase
  const { content } = property
  const features = content.features || { items: [], header: '', headline: '', description: '' }

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
    <div className="flex flex-col">
      <div id="features">
        <ParallaxBanner
          imageSrc={bannerUrl || '/images/banners/yourhome.jpg'}
          title={features.banner_title || "YOUR HOME"}
          loading={bannerLoading}
        />
      </div>

      {/* Content Section */}
      <section className="pt-20 pb-40 px-6 sm:px-8 lg:px-12 bg-brand-light">
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
              <h3 className="text-3xl font-light mb-6 text-brand-dark">{features.headline}</h3>
              <p className="text-brand-dark">{features.description || features.header}</p>
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
      <section className="relative bg-brand-dark">
        <div className="relative w-full px-12 py-16">
          {/* Background Image (Blurred) */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl transform scale-110"
            style={{ 
              backgroundImage: `url(${homeImageUrl || '/images/sections/yourhome/yourhome.jpg'})`,
              opacity: 0.5
            }}
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-brand-dark/70" />

          {/* Content */}
          <div className="relative z-10">
            {/* Features Grid */}
            <div ref={featuresRef} className="max-w-7xl mx-auto mb-8">
              <h4 className="text-2xl font-light mb-4 text-brand-light text-center">Home Highlights</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {features.items?.filter(item => item.feature?.trim()).map((feature, index) => (
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
        </div>
      </section>
    </div>
  )
} 