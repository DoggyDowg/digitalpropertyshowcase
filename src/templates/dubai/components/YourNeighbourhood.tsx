'use client'

import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParallaxBanner } from '@/components/shared/ParallaxBanner'
import { GoogleMap } from '@/components/shared/GoogleMap'
import { getLandmarks } from '@/utils/landmarkUtils'
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader'
import { useNeighbourhoodBanner } from '@/hooks/useNeighbourhoodBanner'
import { useNeighbourhoodImages } from '@/hooks/useNeighbourhoodImages'
import { DynamicImage } from '@/components/shared/DynamicImage'
import type { Landmark } from '@/types/maps'
import type { Property as DBProperty } from '@/types/property'
import type { Property as MapProperty } from '@/types/maps'

interface YourNeighbourhoodProps {
  property: DBProperty
}

export function YourNeighbourhood({ property }: YourNeighbourhoodProps) {
  const { isLoaded } = useGoogleMaps()
  const { imageUrl, loading } = useNeighbourhoodBanner(property.id)
  const { images: neighbourhoodImages, loading: imagesLoading } = useNeighbourhoodImages(property.id)
  const bannerTitle = property.content?.neighbourhood?.banner_title || 'YOUR NEIGHBOURHOOD'
  
  // Map state
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mapProperty, setMapProperty] = useState<MapProperty | null>(null)

  // Animation states
  const [isVisibleRow1, setIsVisibleRow1] = useState(false)
  const [isVisibleRow2, setIsVisibleRow2] = useState(false)
  const [isVisibleRow3, setIsVisibleRow3] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const row1Ref = useRef<HTMLDivElement>(null)
  const row2Ref = useRef<HTMLDivElement>(null)
  const row3Ref = useRef<HTMLDivElement>(null)

  // Set up initialization effect
  useEffect(() => {
    if (!loading && !imagesLoading && property) {
      setIsInitialized(true)
    }
  }, [loading, imagesLoading, property])

  // Register ScrollTrigger plugin
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  // GSAP animations setup
  useEffect(() => {
    if (!isInitialized) return

    // Row 1 animation
    if (row1Ref.current) {
      gsap.from(row1Ref.current.children, {
        scrollTrigger: {
          trigger: row1Ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out',
        onComplete: () => setIsVisibleRow1(true)
      })
    }

    // Row 2 animation
    if (row2Ref.current) {
      gsap.from(row2Ref.current.children, {
        scrollTrigger: {
          trigger: row2Ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out',
        onComplete: () => setIsVisibleRow2(true)
      })
    }

    // Row 3 animation
    if (row3Ref.current) {
      gsap.from(row3Ref.current.children, {
        scrollTrigger: {
          trigger: row3Ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out',
        onComplete: () => setIsVisibleRow3(true)
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [isInitialized])

  // Load landmarks data
  useEffect(() => {
    async function loadLandmarks() {
      try {
        const data = await getLandmarks(property.id)
        setLandmarks(data.landmarks)
        setMapProperty({
          name: property.name,
          position: data.property.position,
          address: data.property.address,
          id: property.id,
          is_demo: property.is_demo
        })
      } catch (err) {
        console.error('Error loading landmarks:', err)
        setError('Failed to load neighbourhood data')
      }
    }

    loadLandmarks()
  }, [property])

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <section className="relative overflow-x-hidden w-full pt-24 md:pt-32">
      <div id="neighbourhood" className="w-full overflow-hidden">
        <ParallaxBanner
          imageSrc={imageUrl || '/images/banners/yourneighbourhood.jpg'}
          title={bannerTitle}
          loading={loading}
        />
      </div>

      {/* Content Rows */}
      <div className="bg-brand-light pt-20 pb-32 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Row 1 */}
          <div 
            ref={row1Ref} 
            className="grid md:grid-cols-2 gap-12 items-center mb-20"
          >
            <div 
              className={`relative h-[400px] transition-all duration-1000 ease-out ${
                isVisibleRow1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {neighbourhoodImages[0] && (
                <DynamicImage
                  src={neighbourhoodImages[0].src}
                  alt={neighbourhoodImages[0].alt}
                  fill
                  className="object-cover rounded-lg"
                />
              )}
            </div>
            <div 
              className={`prose prose-lg max-w-none transition-all duration-1000 ease-out delay-500 text-center ${
                isVisibleRow1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h3 className="text-3xl font-light mb-4 text-brand-dark">{property.content?.neighbourhood?.part1_headline}</h3>
              <p className="text-brand-dark">{property.content?.neighbourhood?.part1_text}</p>
            </div>
          </div>

          {/* Row 2 */}
          <div 
            ref={row2Ref} 
            className="grid md:grid-cols-2 gap-12 items-center mb-20"
          >
            <div 
              className={`prose prose-lg max-w-none transition-all duration-1000 ease-out order-2 md:order-1 text-center ${
                isVisibleRow2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h3 className="text-3xl font-light mb-4 text-brand-dark">{property.content?.neighbourhood?.part2_headline}</h3>
              <p className="text-brand-dark">{property.content?.neighbourhood?.part2_text}</p>
            </div>
            <div 
              className={`relative h-[400px] transition-all duration-1000 ease-out delay-500 order-1 md:order-2 ${
                isVisibleRow2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {neighbourhoodImages[1] && (
                <DynamicImage
                  src={neighbourhoodImages[1].src}
                  alt={neighbourhoodImages[1].alt}
                  fill
                  className="object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Row 3 */}
          <div 
            ref={row3Ref} 
            className="grid md:grid-cols-2 gap-12 items-center mb-20"
          >
            <div 
              className={`relative h-[400px] transition-all duration-1000 ease-out ${
                isVisibleRow3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {neighbourhoodImages[2] && (
                <DynamicImage
                  src={neighbourhoodImages[2].src}
                  alt={neighbourhoodImages[2].alt}
                  fill
                  className="object-cover rounded-lg"
                />
              )}
            </div>
            <div 
              className={`prose prose-lg max-w-none transition-all duration-1000 ease-out delay-500 text-center ${
                isVisibleRow3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h3 className="text-3xl font-light mb-4 text-brand-dark">{property.content?.neighbourhood?.part3_headline}</h3>
              <p className="text-brand-dark">{property.content?.neighbourhood?.part3_text}</p>
            </div>
          </div>

          {/* Map Section */}
          <div className="h-[600px] rounded-lg overflow-hidden">
            {isLoaded && mapProperty ? (
              <GoogleMap property={mapProperty} landmarks={landmarks} center={mapProperty.position} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading map...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
