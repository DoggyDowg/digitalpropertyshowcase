'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useHeroVideo } from '@/hooks/useHeroVideo'
import { HeaderLink } from './shared/HeaderLink'
import styles from '@/styles/Hero.module.css'
import type { Property } from '@/types/property'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  property: Property
}

function scrollToSection(sectionId: string) {
  // Remove any leading # if present
  const targetId = sectionId.replace(/^#/, '');
  console.log('Looking for section with ID:', targetId);
  
  // Try both with and without virtual- prefix
  let element = document.getElementById(targetId);
  if (!element && !targetId.startsWith('virtual-')) {
    element = document.getElementById(`virtual-${targetId}`);
  }
  
  console.log('Found element:', element);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    return true;
  }
  console.warn(`No element found with id "${targetId}" or "virtual-${targetId}"`);
  return false;
}

export function Hero({ property }: HeroProps) {
  // For demo properties, use the full path to the demo video
  const heroVideoPath = property.is_demo 
    ? 'demo/hero_video/hero.mp4'
    : property.id
  const { videoUrl } = useHeroVideo(heroVideoPath)

  // Refs for GSAP animations
  const addressRef = useRef<HTMLHeadingElement>(null)
  const suburbRef = useRef<HTMLHeadingElement>(null)
  const ctaContainerRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subheadlineRef = useRef<HTMLParagraphElement>(null)
  const topSectionRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  // Set up GSAP animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    const videoElement = document.querySelector('video')

    // Set up scroll animation for top section
    if (topSectionRef.current) {
      gsap.to(topSectionRef.current, {
        y: '-50%',
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: '+=50%',
          scrub: 0.5,
          immediateRender: true,
          onUpdate: (self) => {
            const progress = self.progress
            const blurAmount = Math.pow(progress * 20, 2)
            gsap.set(topSectionRef.current, {
              filter: `blur(${blurAmount}px)`
            })
          }
        }
      })
    }

    // Function to start initial animations
    const startAnimations = () => {
      // Initial state - set elements to be blurred and slightly translated
      gsap.set([logoRef.current, addressRef.current, suburbRef.current, ctaContainerRef.current, headlineRef.current, subheadlineRef.current], {
        opacity: 0,
        y: 30,
        filter: 'blur(10px)'
      })

      // Video reveal animation
      const videoOverlay = document.querySelector('.video-overlay')
      if (videoOverlay) {
        gsap.set(videoOverlay, {
          backgroundColor: '#111111',
          opacity: 1
        })

        gsap.to(videoOverlay, {
          opacity: 0.5,
          duration: 4,
          delay: 1.5,
          ease: "power2.inOut",
        })
      }

      // Text animations sequence
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6,
        delay: 2
      })
      .to(addressRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6
      }, '-=1.0')
      .to(suburbRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6
      }, '-=1.0')
      .to(ctaContainerRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6
      }, '-=1.0')
      .to(headlineRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6
      }, '-=1.0')
      .to(subheadlineRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.6
      }, '-=1.0')
    }

    // Start animations when video is loaded
    if (videoElement) {
      if (videoElement.readyState >= 3) {
        startAnimations()
      } else {
        videoElement.addEventListener('loadeddata', startAnimations)
      }
    } else {
      startAnimations()
    }

    // Cleanup
    return () => {
      videoElement?.removeEventListener('loadeddata', startAnimations)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section className="relative h-screen w-full overflow-x-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {videoUrl ? (
          <>
            <video
              className="absolute h-[100vh] w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            {/* Video overlay for fade effect */}
            <div 
              className="video-overlay absolute inset-0 bg-black/50" 
              style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} 
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-brand-dark" />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col text-brand-light text-center px-4 sm:px-6 lg:px-12">
        {/* Initial Navigation */}
        <div className="hidden md:block pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative flex items-center justify-between">
              {/* Left Navigation Group */}
              <div className="flex items-center gap-8 lg:gap-12">
                <HeaderLink 
                  href="#features" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Features
                </HeaderLink>
                <HeaderLink 
                  href="#lifestyle" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Lifestyle
                </HeaderLink>
                <HeaderLink 
                  href="#neighbourhood" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Neighbourhood
                </HeaderLink>
              </div>

              {/* Right Navigation Group */}
              <div className="flex items-center gap-8 lg:gap-12">
                <HeaderLink 
                  href="#info" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Info
                </HeaderLink>
                <HeaderLink 
                  href="#viewings" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Viewings
                </HeaderLink>
                <HeaderLink 
                  href="#contact" 
                  className="!text-brand-light hover:!text-brand-light/80 after:!bg-brand-light [&::before]:!bg-brand-light"
                >
                  Make an Enquiry
                </HeaderLink>
              </div>
            </div>
          </div>
        </div>

        {/* Top Section - Property Address */}
        <div ref={topSectionRef} className="pt-[60px] sm:pt-[80px] will-change-transform">
          {/* Agency Logo */}
          <div ref={logoRef} className="flex justify-center mb-4">
            {property.agency_settings?.branding?.logo?.light && (
              <Image
                src={property.agency_settings.branding.logo.light}
                alt={property.agency_name || 'Agency Logo'}
                width={160}
                height={40}
                className="h-auto w-[140px] sm:w-[160px] object-contain"
                priority
              />
            )}
          </div>

          <h2 ref={addressRef} className="text-xl sm:text-2xl md:text-3xl font-light mb-2 text-brand-light">{property.street_address}</h2>
          <h3 ref={suburbRef} className="text-3xl sm:text-4xl md:text-6xl font-light text-brand-light">{property.suburb}</h3>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-auto pb-[60px] sm:pb-[80px]">
          {/* CTA Buttons */}
          <div ref={ctaContainerRef} className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
            {/* Left slide effect button */}
            <button 
              className={`${styles.slideEffect} px-8 py-3 text-brand-light bg-brand-dark active:translate-y-[3px]`}
              onClick={() => {
                console.log('Primary button clicked');
                const primaryBtn = property.metadata?.more_info?.ctaButtons?.primary;
                console.log('Primary button config:', primaryBtn);
                
                if (primaryBtn?.type === 'anchor' && primaryBtn.url) {
                  scrollToSection(primaryBtn.url);
                } else if (primaryBtn?.url) {
                  window.open(primaryBtn.url, '_blank');
                } else {
                  console.log('No valid URL or type configured');
                }
              }}
            >
              {property.metadata?.more_info?.ctaButtons?.primary?.label || 'Book a Viewing'}
            </button>

            {/* Right slide effect button */}
            <button 
              className={`${styles.slideEffectReverse} px-8 py-3 text-brand-light active:translate-y-[3px]`}
              onClick={() => {
                console.log('Secondary button clicked');
                const secondaryBtn = property.metadata?.more_info?.ctaButtons?.secondary;
                console.log('Secondary button config:', secondaryBtn);
                
                if (secondaryBtn?.type === 'anchor' && secondaryBtn.url) {
                  scrollToSection(secondaryBtn.url);
                } else if (secondaryBtn?.url) {
                  window.open(secondaryBtn.url, '_blank');
                } else {
                  console.log('No valid URL or type configured');
                }
              }}
            >
              {property.metadata?.more_info?.ctaButtons?.secondary?.label || 'Download Brochure'}
            </button>
          </div>

          {/* Headline and Subheadline */}
          <h1 ref={headlineRef} className="text-2xl sm:text-3xl md:text-5xl font-light mb-3 sm:mb-4 px-4 sm:px-0 text-brand-light">
            {property.content.hero.headline}
          </h1>
          <p ref={subheadlineRef} className="text-lg sm:text-xl md:text-2xl font-light max-w-2xl mx-auto px-4 sm:px-0 text-brand-light">
            {property.content.hero.subheadline}
          </p>
        </div>
      </div>
    </section>
  )
}