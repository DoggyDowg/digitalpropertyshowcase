'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { siteContent } from '@/config/content'
import styles from '@/styles/DocumentLink.module.css'
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useMoreInfoVideo } from '@/hooks/useMoreInfoVideo'
import { useMoreInfoFloorplans } from '@/hooks/useMoreInfoFloorplans'
import { PDFPreview } from '@/components/shared/PDFPreview'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { AddToCalendar } from './AddToCalendar'
import type { Asset } from '@/types/assets'
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { format } from 'date-fns'
import { useAgent } from '@/hooks/useAgent'

interface MoreInfoProps {
  property: PropertyType;
}

interface PropertyType {
  id: string;
  title?: string;
  name?: string;
  address?: string;
  street_address?: string;
  suburb?: string;
  sale_type?: string;
  auction_datetime?: string;
  price?: string;
  is_demo?: boolean;
  agent_id?: string | null;
  metadata?: {
    more_info?: {
      documents?: Array<{ label: string; url: string }>;
      additionalInfo?: Array<{ info: string; detail: string }>;
    };
    locations?: {
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  agency_settings?: {
    branding?: {
      colors?: {
        accent?: string;
      };
    };
  };
  local_timezone: string;
  maps_address?: string | null;
  styling?: {
    textLinks?: {
      hoverEffect?: 'scale' | 'underline' | 'slide' | 'fade' | 'glow';
    };
  };
}

// DynamicLink component with improved hover styling
function DynamicLink({ 
  href, 
  children, 
  className = "", 
  property, 
  onClick 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
  property: PropertyType;
  onClick?: () => void;
}) {
  // Get hover effect from property styling
  const hoverEffect = property.styling?.textLinks?.hoverEffect || 'scale';
  
  // Use CSS classes for hover effects instead of inline styles
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.link} ${className} dynamic-hover ${hoverEffect}-hover`}
      onClick={onClick}
      data-hover="true"
      data-hover-effect={hoverEffect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </a>
  );
}

export function MoreInfo({ property }: MoreInfoProps) {
  const { moreInfo } = siteContent
  const [showFloorplan, setShowFloorplan] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [selectedFloorplan, setSelectedFloorplan] = useState<Asset | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { videoUrl, loading: videoLoading, error: videoError } = useMoreInfoVideo(property.id, property.is_demo ?? false)
  const { floorplans } = useMoreInfoFloorplans(property.id, property.is_demo ?? false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [demoContent, setDemoContent] = useState<{
    documents: Array<{ label: string; url: string }>;
    additionalInfo: Array<{ info: string; detail: string }>;
  } | null>(null)
  const { agent } = useAgent(property.agent_id)

  // State to store calendar data
  const [calendarData, setCalendarData] = useState<{
    date: string;
    time: string;
    endTime: string;
    timezone: string;
    description: string;
    title: string;
    location: string;
  } | null>(null)

  // Get hover effect from property styling for debugging
  const hoverEffect = property?.styling?.textLinks?.hoverEffect || 'scale';
  
  // Debug log the hover effect
  useEffect(() => {
    console.log('MoreInfo Component:', {
      hoverEffect,
      propertyId: property.id,
      hasStyling: !!property.styling
    });
  }, [property.id, property.styling, hoverEffect]);

  // Set up demo content if needed
  useEffect(() => {
    if (property.is_demo) {
      setDemoContent({
        documents: [
          { label: 'Statement of Information', url: '#' },
          { label: 'Contract of Sale', url: '#' }
        ],
        additionalInfo: [
          { info: 'Council Rates', detail: '$2,600 per annum' },
          { info: 'Body Corp', detail: '$460 per qtr' }
        ]
      })
    }
  }, [property.is_demo])

  // Get the content to display based on whether it's a demo property or not
  const displayDocuments = property.is_demo 
    ? demoContent?.documents 
    : property.metadata?.more_info?.documents

  const displayAdditionalInfo = property.is_demo 
    ? demoContent?.additionalInfo 
    : property.metadata?.more_info?.additionalInfo

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

  // Set the first floorplan as selected by default when floorplans load
  useEffect(() => {
    if (floorplans.length > 0) {
      setSelectedFloorplan(floorplans[0])
    }
  }, [floorplans])

  // Add default demo values for documents and additional info
  useEffect(() => {
    if (property.is_demo && property.metadata?.more_info) {
      property.metadata.more_info = {
        ...property.metadata.more_info,
        documents: [
          { label: 'Statement of Information', url: '#' },
          { label: 'Contract of Sale', url: '#' }
        ],
        additionalInfo: [
          { info: 'Council Rates', detail: '$2,600 per annum' },
          { info: 'Body Corp', detail: '$460 per qtr' }
        ]
      }
    }
  }, [property.is_demo, property.metadata])

  // Debug logging for auction properties
  useEffect(() => {
    const debugInfo = {
      component: 'MoreInfo',
      propertyId: property.id,
      saleType: property.sale_type,
      auctionDateTime: property.auction_datetime,
      isAuctionDateValid: property.auction_datetime ? !isNaN(new Date(property.auction_datetime).getTime()) : false,
      showingAuctionSection: property.sale_type === 'auction' && property.auction_datetime,
    }
    
    console.log('🎯 MoreInfo Component Debug:', debugInfo)
  }, [property.id, property.sale_type, property.auction_datetime])

  // Format auction date for calendar
  const formatAuctionForCalendar = useCallback(async (auctionDatetime: string) => {
    try {
      const date = new Date(auctionDatetime)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      // Format the date and time strings
      const formattedDate = format(date, 'yyyy-MM-dd')
      const formattedTime = format(date, 'HH:mm')
      
      // Calculate end time (30 minutes after start)
      const endDate = new Date(date.getTime() + 30 * 60000)
      const endTime = format(endDate, 'HH:mm')

      // Format the address for title and description
      const formattedAddress = property.street_address && property.suburb
        ? `${property.street_address}, ${property.suburb}`
        : property.maps_address || property.address || property.name || ''

      // Format event title with street address and suburb
      const eventTitle = `Auction - ${formattedAddress}`

      // Format a detailed description
      const formattedDateTime = format(date, 'EEEE, MMMM do, yyyy h:mm a')
      let description = `Auction for ${formattedAddress}\n\n`
      description += `📅 Date & Time: ${formattedDateTime}\n`
      description += `📍 Location: ${formattedAddress}\n\n`

      // Add agent information if available
      if (agent) {
        description += `Contact Information:\n`
        description += `${agent.name} - ${agent.position}\n`
        description += `📞 ${agent.phone}\n`
        description += `📧 ${agent.email}\n`
      }

      // Create location string with coordinates if available
      let location = property.maps_address || formattedAddress
      if (property.metadata?.locations?.coordinates) {
        location = `${location}@${property.metadata.locations.coordinates.lat},${property.metadata.locations.coordinates.lng}`
      }
      
      return {
        date: formattedDate,
        time: formattedTime,
        endTime: endTime,
        timezone: property.local_timezone,
        description,
        title: eventTitle,
        location
      }
    } catch (error) {
      console.error('Error formatting auction date:', error)
      return null
    }
  }, [property.name, property.address, property.maps_address, property.street_address, property.suburb, property.metadata?.locations?.coordinates, property.local_timezone, agent])

  // Update calendar data when auction datetime changes
  useEffect(() => {
    if (property.auction_datetime) {
      formatAuctionForCalendar(property.auction_datetime).then(data => {
        setCalendarData(data)
      })
    }
  }, [property.auction_datetime, formatAuctionForCalendar])

  // Guard against undefined content
  if (!moreInfo) return null

  // Add proper null checks for agency settings and branding
  const branding = property.agency_settings?.branding
  const colors = branding?.colors
  const accentColor = colors?.accent || '#f5f5f5'

  // Determine if video is from YouTube
  const isYouTubeVideo = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')

  // Add debug logging right before render
  console.log('%c MoreInfo Debug 🔍', 'background: #222; color: #bada55; padding: 2px;')
  console.table({
    'Sale Type': property.sale_type,
    'Auction Date': property.auction_datetime,
    'Property Coordinates': property.metadata?.locations?.coordinates 
      ? `${property.metadata.locations.coordinates.lat}, ${property.metadata.locations.coordinates.lng}`
      : 'Not available',
    'Is Auction': property.sale_type === 'auction',
    'Has Date': Boolean(property.auction_datetime),
    'Valid Date': property.auction_datetime ? !isNaN(new Date(property.auction_datetime).getTime()) : false
  })

  return (
    <section 
      ref={sectionRef}
      id="info"
      className="py-20"
      style={{ 
        backgroundColor: accentColor
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Auction Information - Only show for auction properties */}
        {property.sale_type === 'auction' && property.auction_datetime && (
          <div 
            className={`mb-16 text-center transition-all duration-1000 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-4xl font-light mb-4 text-brand-dark">Auction</h2>
            <div className="flex flex-col items-center gap-4">
              <p className="text-3xl text-brand-dark font-medium">
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
                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
                    
                    return `${day}, ${month} ${date} at ${formattedHours}${formattedMinutes}${ampm}`;
                  } catch (error) {
                    console.error('Error formatting auction date:', error);
                    return 'Date to be announced';
                  }
                })()}
              </p>
              {property.auction_datetime && !isNaN(new Date(property.auction_datetime).getTime()) && (
                <div className="transform hover:scale-105 transition-transform" style={{ position: 'relative', isolation: 'isolate' }}>
                  {calendarData && (
                    <AddToCalendar
                      name={calendarData.title}
                      description={calendarData.description}
                      location={calendarData.location}
                      startDate={calendarData.date}
                      startTime={calendarData.time}
                      endTime={calendarData.endTime}
                      timezone={calendarData.timezone}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
                  {isYouTubeVideo ? (
                    <iframe
                      src={`${getYouTubeEmbedUrl(getYouTubeVideoId(videoUrl) || '')}?controls=0&autoplay=0`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      src={videoUrl}
                      preload="metadata"
                    />
                  )}
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
            {displayAdditionalInfo?.some((item) => item.info && item.detail) && (
              <div 
                className="p-6 rounded-lg shadow-sm text-center backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              >
                <h3 className="text-xl font-light mb-4 text-brand-dark">More Info</h3>
                <ul className="space-y-3 max-w-md mx-auto">
                  {displayAdditionalInfo?.filter((item) => item.info && item.detail).map((item) => (
                    <li key={item.info} className="flex flex-col sm:flex-row justify-between items-center text-brand-dark border-b border-brand-light pb-2 last:border-0 last:pb-0 gap-1">
                      <span className="font-light text-sm">{item.info}</span>
                      <span className="font-medium text-sm">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Documents Section */}
            {displayDocuments?.some((doc) => doc.label && doc.url) && (
              <div 
                className="p-6 rounded-lg shadow-sm text-center backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.2)' }}
              >
                <h3 className="text-xl font-light mb-4 text-brand-dark">Important Documents</h3>
                <ul className="space-y-3 max-w-md mx-auto">
                  {displayDocuments?.filter((doc) => doc.label && doc.url).map((doc) => (
                    <li key={doc.label} className="flex justify-center">
                      <DynamicLink
                        href={doc.url}
                        property={property}
                        className="text-brand-dark inline-flex items-center cursor-pointer text-sm"
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
                      </DynamicLink>
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
                {selectedFloorplan?.type === 'pdf' ? (
                  <PDFPreview 
                    url={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan.storage_path}`}
                    className="transition-all duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan?.storage_path}`}
                    alt="Property Floorplan"
                    fill
                    className="object-contain transition-all duration-300 group-hover:scale-105"
                  />
                )}
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
            {isYouTubeVideo ? (
              <iframe
                src={`${getYouTubeEmbedUrl(getYouTubeVideoId(videoUrl) || '')}?autoplay=1&rel=0&modestbranding=1&playsinline=1&showinfo=0&enablejsapi=1&origin=${process.env.NEXT_PUBLIC_APP_URL}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                className="w-full h-full"
                controls
                autoPlay
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
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
            {selectedFloorplan.type === 'pdf' ? (
              <div className="relative h-full">
                <PDFPreview 
                  url={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan.storage_path}`}
                />
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan.storage_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-brand-light text-brand-dark rounded-lg hover:bg-brand-light/90 transition-colors text-lg font-medium"
                >
                  Open PDF in New Tab
                </a>
              </div>
            ) : (
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-assets/${selectedFloorplan.storage_path}`}
                alt="Property Floorplan"
                fill
                className="object-contain"
              />
            )}
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