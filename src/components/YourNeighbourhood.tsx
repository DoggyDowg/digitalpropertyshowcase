'use client'

import { useEffect, useState, useRef } from 'react'
import { ParallaxBanner } from './shared/ParallaxBanner'
import { GoogleMap } from '@/components/shared/GoogleMap'
import { getLandmarks } from '@/utils/landmarkUtils'
import { useGoogleMaps } from '@/components/shared/GoogleMapsLoader'
import { useNeighbourhoodBanner } from '@/hooks/useNeighbourhoodBanner'
import { useNeighbourhoodImages } from '@/hooks/useNeighbourhoodImages'
import { DynamicImage } from './shared/DynamicImage'
import type { Landmark } from '@/types/maps'
import type { Property as DBProperty } from '@/types/property'
import type { Property as MapProperty } from '@/types/maps'
import { AerialGallery } from './AerialGallery'
import { useAerialImages } from '@/hooks/useAerialImages'

interface YourNeighbourhoodProps {
  property: DBProperty
}

export function YourNeighbourhood({ property }: YourNeighbourhoodProps) {
  const { isLoaded } = useGoogleMaps()
  const { imageUrl, loading } = useNeighbourhoodBanner(property.id, property.is_demo)
  const { images: neighbourhoodImages, loading: imagesLoading } = useNeighbourhoodImages(property.id, property.is_demo)
  const { images: aerialImages } = useAerialImages(property.id, property.is_demo)
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

  // Animation observers - only set up after initialization
  useEffect(() => {
    if (!isInitialized) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === row1Ref.current) {
              setIsVisibleRow1(true)
            }
            if (entry.target === row2Ref.current) {
              setIsVisibleRow2(true)
            }
            if (entry.target === row3Ref.current) {
              setIsVisibleRow3(true)
            }
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    if (row1Ref.current) observer.observe(row1Ref.current)
    if (row2Ref.current) observer.observe(row2Ref.current)
    if (row3Ref.current) observer.observe(row3Ref.current)

    return () => observer.disconnect()
  }, [isInitialized])

  // Load landmarks data
  useEffect(() => {
    async function loadLandmarks() {
      if (!property?.id) {
        console.error('No property ID available');
        setError('Property information not available');
        return;
      }

      try {
        const data = await getLandmarks(property.id);
        
        if (!data.landmarks) {
          console.error('Invalid landmarks data received:', data);
          setError('Invalid landmarks data received');
          return;
        }

        setMapProperty({
          name: property.name,
          position: {
            lat: property.latitude ?? 0,
            lng: property.longitude ?? 0
          },
          address: property.maps_address || '',
          id: property.id,
          is_demo: property.is_demo
        });

        if (property.latitude && property.longitude) {
          setLandmarks(data.landmarks);
        } else {
          console.warn('Property coordinates are missing');
          setLandmarks([]);
        }
      } catch (err) {
        console.error('Error loading landmarks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load neighbourhood data');
      }
    }

    loadLandmarks();
  }, [property]);

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <section className="relative">
      <div id="neighbourhood">
        <ParallaxBanner
          imageSrc={imageUrl || '/images/banners/yourneighbourhood.jpg'}
          title={bannerTitle}
          loading={loading}
        />
      </div>

      {/* Content Rows */}
      <div className="bg-brand-light pt-20 pb-20">
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
          <section className="bg-brand-light py-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="h-[600px] rounded-lg overflow-hidden shadow-lg mb-8">
                {isLoaded && mapProperty && (
                  <GoogleMap 
                    property={mapProperty} 
                    landmarks={landmarks}
                    center={mapProperty.position}
                  />
                )}
              </div>

              {/* Aerial Gallery - Only show if there are aerial images */}
              {aerialImages.length > 0 && (
                <div className="mt-12 text-center">
                  <h4 className="text-2xl font-light mb-6 text-brand-dark text-center">Aerial Views</h4>
                  <AerialGallery property={property} />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
