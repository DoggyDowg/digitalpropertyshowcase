'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { siteContent } from '@/config/content'
import styles from '@/styles/DocumentLink.module.css'
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useMoreInfoVideo } from '@/hooks/useMoreInfoVideo'
import type { Asset } from '@/types/assets'
import type { Property } from '@/types/property'

interface DocumentItem {
  label: string
  url: string
}

interface InfoItem {
  info: string
  detail: string
}

interface MoreInfoProps {
  property: Property;
}

export function MoreInfo({ property }: MoreInfoProps) {
  const { moreInfo } = siteContent
  const [showFloorplan, setShowFloorplan] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [floorplans, setFloorplans] = useState<Asset[]>([])
  const [selectedFloorplan, setSelectedFloorplan] = useState<Asset | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClientComponentClient()
  const { videoUrl, loading: videoLoading, error: videoError } = useMoreInfoVideo(property.id)

  console.log('MoreInfo render - videoUrl:', videoUrl)
  console.log('MoreInfo render - videoLoading:', videoLoading)
  console.log('MoreInfo render - videoError:', videoError)

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
        threshold: 0.25,
        rootMargin: '-100px 0px -100px 0px'
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Load floorplan asset
  useEffect(() => {
    async function loadFloorplan() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('property_id', property.id)
          .eq('category', 'floorplan')
          .eq('status', 'active')

        if (error) {
          console.error('Error loading floorplan:', error)
          return
        }

        setFloorplans(data || [])
        // Set the first floorplan as selected by default
        if (data && data.length > 0) {
          setSelectedFloorplan(data[0])
        }
      } catch (err) {
        console.error('Error loading floorplan:', err)
      }
    }

    if (property.id) {
      loadFloorplan()
    }
  }, [property.id, supabase])

  // Guard against undefined content
  if (!moreInfo) return null

  // Add proper null checks for agency settings and branding
  const agencySettings = property.agency_settings || {
    branding: {
      colors: {
        accent: '#f5f5f5'
      }
    }
  }
  const branding = agencySettings.branding
  const colors = branding.colors
  const accentColor = colors.accent

  return (
    <section 
      ref={sectionRef}
      className="py-20"
      style={{ 
        backgroundColor: accentColor
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Information */}
          <div 
            className={`space-y-10 transition-all duration-1000 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Price Guide */}
            <div 
              className="p-6 rounded-lg shadow-sm text-center backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
            >
              <h3 className="text-xl font-light mb-2 text-brand-dark">{moreInfo.priceGuide.title}</h3>
              <p className="text-3xl text-brand-dark">{property.price}</p>
            </div>

            {/* Video Section */}
            {videoLoading ? (
              <div 
                className="relative w-full aspect-[16/9] max-w-md mx-auto animate-pulse rounded-lg backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              />
            ) : videoUrl ? (
              <div 
                className="relative w-full aspect-[16/9] max-w-md mx-auto cursor-pointer group rounded-lg overflow-hidden shadow-sm backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
                onClick={() => setShowVideo(true)}
              >
                {/* Video Preview */}
                <div className="absolute inset-0 overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    src={videoUrl}
                    preload="metadata"
                  />
                </div>
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/20 group-hover:bg-brand-dark/30 transition-all">
                  <div 
                    className="w-14 h-14 flex items-center justify-center rounded-full hover:scale-110 transition-all duration-150 cursor-pointer shadow-sm"
                    style={{ backgroundColor: 'rgb(var(--brand-light-rgb))' }}
                  >
                    <PlayIcon className="w-6 h-6 text-brand-dark" />
                  </div>
                </div>
              </div>
            ) : videoError ? (
              <div 
                className="relative w-full aspect-[16/9] max-w-md mx-auto rounded-lg flex items-center justify-center text-gray-500 shadow-sm backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              >
                <span className="text-brand-dark/70">Failed to load video</span>
              </div>
            ) : null}

            {/* Property Info Section */}
            {property.metadata?.more_info?.additionalInfo?.some((item: InfoItem) => item.info && item.detail) && (
              <div 
                className="p-6 rounded-lg shadow-sm text-center backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              >
                <h3 className="text-xl font-light mb-4 text-brand-dark">More Info</h3>
                <ul className="space-y-3 max-w-md mx-auto">
                  {property.metadata?.more_info?.additionalInfo?.filter((item: InfoItem) => item.info && item.detail).map((item: InfoItem) => (
                    <li key={item.info} className="flex flex-col sm:flex-row justify-between items-center text-brand-dark border-b border-brand-light pb-2 last:border-0 last:pb-0 gap-1">
                      <span className="font-light text-sm">{item.info}</span>
                      <span className="font-medium text-sm">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Documents Section */}
            {property.metadata?.more_info?.documents?.some((doc: DocumentItem) => doc.label && doc.url) && (
              <div 
                className="p-6 rounded-lg shadow-sm text-center backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              >
                <h3 className="text-xl font-light mb-4 text-brand-dark">Important Documents</h3>
                <ul className="space-y-3 max-w-md mx-auto">
                  {property.metadata?.more_info?.documents?.filter((doc: DocumentItem) => doc.label && doc.url).map((doc: DocumentItem) => (
                    <li key={doc.label} className="flex justify-center">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.link} text-brand-dark hover:text-brand-dark/80 hover:translate-x-1 transition-all duration-150 inline-flex items-center cursor-pointer text-sm`}
                      >
                        <svg
                          className="w-4 h-4 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        {doc.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Floorplan */}
          <div>
            {floorplans.length > 0 ? (
              <div
                ref={imageRef}
                className={`relative h-[600px] cursor-pointer group p-4 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-1000 delay-300 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
                onClick={() => setShowFloorplan(true)}
              >
                {/* Floorplan Navigation */}
                {floorplans.length > 1 && (
                  <div className="absolute top-6 left-6 z-10 flex gap-2">
                    {floorplans.map((plan, index) => (
                      <button
                        key={plan.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFloorplan(plan);
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          selectedFloorplan?.id === plan.id
                            ? 'bg-brand-dark text-brand-light'
                            : 'bg-brand-light/80 text-brand-dark hover:bg-brand-light'
                        }`}
                      >
                        Floor {index + 1}
                      </button>
                    ))}
                  </div>
                )}
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan?.storage_path}`}
                  alt="Property Floorplan"
                  fill
                  className="object-contain transition-all duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center transition-all">
                  <span className="bg-brand-light/90 backdrop-blur-sm px-4 py-2 rounded shadow-sm text-brand-dark text-sm group-hover:scale-105 transition-all duration-150">
                    Click to enlarge
                  </span>
                </div>
              </div>
            ) : (
              <div
                ref={imageRef}
                className={`relative h-[600px] flex items-center justify-center bg-brand-light/20 rounded-lg shadow-sm ${isVisible ? 'animate__animated animate__customFadeInUp animate__delay-1s' : 'opacity-0'}`}
              >
                <p className="text-brand-dark/70">No floorplan available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {showVideo && videoUrl && (
        <div className="fixed inset-0 bg-brand-dark bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl aspect-video">
            <video
              className="w-full h-full"
              controls
              autoPlay
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              className="absolute top-4 right-4 text-brand-light p-2 hover:bg-brand-light/10 rounded-full transition-all duration-150 hover:scale-110 cursor-pointer"
              onClick={() => setShowVideo(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Floorplan Modal */}
      {showFloorplan && selectedFloorplan && (
        <div
          className="fixed inset-0 bg-brand-dark bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setShowFloorplan(false)}
        >
          <div className="relative w-full max-w-6xl h-[90vh]">
            {/* Floorplan Navigation in Modal */}
            {floorplans.length > 1 && (
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                {floorplans.map((plan, index) => (
                  <button
                    key={plan.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFloorplan(plan);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      selectedFloorplan.id === plan.id
                        ? 'bg-brand-light text-brand-dark'
                        : 'bg-brand-dark/80 text-brand-light hover:bg-brand-dark'
                    }`}
                  >
                    Floor {index + 1}
                  </button>
                ))}
              </div>
            )}
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan.storage_path}`}
              alt="Property Floorplan"
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 text-brand-light hover:scale-110 transition-all duration-150 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowFloorplan(false);
              }}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}