'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ParallaxBanner } from './shared/ParallaxBanner'
import { HomeGallery } from './HomeGallery'
import { useFeaturesBanner } from '@/hooks/useFeaturesBanner'
import { useYourHomeImage } from '@/hooks/useYourHomeImage'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from '@/styles/Hero.module.css'
import type { Property } from '@/types/property'
import { format } from 'date-fns'
import { AddToCalendar } from './AddToCalendar'
import { useAgent } from '@/hooks/useAgent'

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
  const { agent } = useAgent(property.agent_id)
  
  // State to store calendar data for auction
  const [calendarData, setCalendarData] = useState<{
    date: string;
    time: string;
    endTime: string;
    timezone: string;
    description: string;
    title: string;
    location: string;
  } | null>(null)
  
  const featuresData = useMemo(() => 
    content.features || { items: [], header: '', headline: '', description: '' }
  , [content.features])

  // Check if virtual tour is enabled
  const showVirtualTour = useMemo(() => {
    return property.virtual_tour_enabled;
  }, [property.virtual_tour_enabled]);

  // Format auction date for calendar
  const formatAuctionForCalendar = useCallback(async (auctionDatetime: string) => {
    try {
      // Parse the UTC date from the database
      const utcDate = new Date(auctionDatetime);
      if (isNaN(utcDate.getTime())) {
        throw new Error('Invalid date');
      }

      // Log the auction date being processed for debugging
      console.log('YourHome - Auction Calendar - Original date info:', {
        input: auctionDatetime,
        parsedUtc: utcDate.toISOString(),
        timezoneName: property.local_timezone
      });

      // Format the date and time strings for the calendar (in YYYY-MM-DD and HH:MM format)
      // These formats are expected by the AddToCalendar component
      const formattedDate = format(utcDate, 'yyyy-MM-dd');
      const formattedTime = format(utcDate, 'HH:mm');
      
      // Calculate end time (30 minutes after start)
      const endDate = new Date(utcDate.getTime() + 30 * 60000);
      const endTime = format(endDate, 'HH:mm');

      // Format the address for title and description
      const formattedAddress = property.street_address && property.suburb
        ? `${property.street_address}, ${property.suburb}`
        : property.maps_address || property.name || '';

      // Format event title with street address and suburb
      const eventTitle = `Auction - ${formattedAddress}`;

      // Format a detailed description - use unambiguous date format
      const formattedDateTime = format(utcDate, 'EEEE, MMMM d, yyyy h:mm a');
      let description = `Auction for ${formattedAddress}\n\n`;
      description += `📅 Date & Time: ${formattedDateTime}\n`;
      description += `📍 Location: ${formattedAddress}\n\n`;

      // Add agent information if available
      if (agent) {
        description += `Contact Information:\n`;
        description += `${agent.name} - ${agent.position}\n`;
        description += `📞 ${agent.phone}\n`;
        description += `📧 ${agent.email}\n`;
      }

      // Create location string with coordinates if available
      let location = property.maps_address || formattedAddress;
      if (property.metadata?.locations?.coordinates) {
        location = `${location}@${property.metadata.locations.coordinates.lat},${property.metadata.locations.coordinates.lng}`;
      }
      
      return {
        date: formattedDate,
        time: formattedTime,
        endTime: endTime,
        timezone: property.local_timezone,
        description,
        title: eventTitle,
        location
      };
    } catch (error) {
      console.error('Error formatting auction date in YourHome:', error);
      return null;
    }
  }, [property.name, property.maps_address, property.street_address, property.suburb, property.metadata?.locations?.coordinates, property.local_timezone, agent]);

  // Update calendar data when auction datetime changes
  useEffect(() => {
    if (property.auction_datetime) {
      formatAuctionForCalendar(property.auction_datetime).then(data => {
        setCalendarData(data)
      })
    }
  }, [property.auction_datetime, formatAuctionForCalendar])

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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                    <p className="text-brand-dark">
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
                        } catch {
                          // console.error('Error formatting auction date');
                          return 'Date to be announced';
                        }
                      })()}
                    </p>
                    {/* Add to Calendar button */}
                    {calendarData && (
                      <div className="sm:ml-2">
                        <AddToCalendar
                          name={calendarData.title}
                          description={calendarData.description}
                          location={calendarData.location}
                          startDate={calendarData.date}
                          startTime={calendarData.time}
                          endTime={calendarData.endTime}
                          timezone={calendarData.timezone}
                          propertyId={property.id}
                        />
                      </div>
                    )}
                  </div>
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
                <div className="relative w-full h-full aspect-video bg-gray-300 animate-pulse rounded-lg overflow-hidden shadow-md cursor-pointer group">
                  <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/50 text-white px-4 py-2 rounded-md text-sm">Click to expand</div>
                  </div>
                </div>
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
            backgroundImage: `url(${homeImageUrl || ''})`,
            opacity: 0.5
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