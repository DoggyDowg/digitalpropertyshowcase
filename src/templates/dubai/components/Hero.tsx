'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useHeroVideo } from '@/hooks/useHeroVideo'
import styles from '@/styles/Hero.module.css'
import type { Property } from '@/types/property'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { HeaderLink } from '@/components/shared/HeaderLink'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  property: Property
}

export function Hero({ property }: HeroProps) {
  const { videoUrl } = useHeroVideo(property.id)
  // Add loading state to coordinate animations
  const [isReady, setIsReady] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Refs for GSAP animations
  const addressRef = useRef<HTMLHeadingElement>(null)
  const suburbRef = useRef<HTMLHeadingElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subheadlineRef = useRef<HTMLParagraphElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const topSectionRef = useRef<HTMLDivElement>(null)
  // Add refs for CTA buttons
  const ctaContainerRef = useRef<HTMLDivElement>(null)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)
  const secondaryBtnRef = useRef<HTMLButtonElement>(null)

  // Track hydration state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Set up GSAP animations
  useEffect(() => {
    // Skip animation setup until hydration is complete
    if (!isHydrated) return
    
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    const videoElement = document.querySelector('video')

    // Set up immediate scroll animation
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

    // Set initial states
    gsap.set([
      logoRef.current, 
      addressRef.current, 
      suburbRef.current, 
      headlineRef.current, 
      subheadlineRef.current,
      primaryBtnRef.current,
      secondaryBtnRef.current
    ], {
      opacity: 0,
      y: 30,
      filter: 'blur(10px)'
    })
      
    // Video reveal animation
    gsap.set(".video-overlay", {
      backgroundColor: '#111111',
      opacity: 1
    })

    // Function to start initial animations
    const startAnimations = () => {
      // Set isReady to coordinate animations
      setIsReady(true)

      gsap.to(".video-overlay", {
        opacity: 0,
        duration: 3,
        delay: 1.5, // Reduced from 4 to 1.5 for a better user experience
        ease: "power2.inOut",
      })

      // Text animations
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        delay: 1 // Reduced from 4 to 1 for a faster initial display
      })
      .to(addressRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2
      }, '-=0.8')
      .to(suburbRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2
      }, '-=0.8')
      .to(headlineRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2
      }, '-=0.8')
      .to(subheadlineRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2
      }, '-=0.8')
      // Add CTA button animations
      .to([primaryBtnRef.current, secondaryBtnRef.current], {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        stagger: 0.2
      }, '-=0.8')
    }

    // Start animations when video is loaded or after a timeout
    const videoLoadTimer = setTimeout(() => {
      // If video hasn't loaded within 2 seconds, start animations anyway
      startAnimations()
    }, 2000)

    if (videoElement) {
      if (videoElement.readyState >= 3) {
        clearTimeout(videoLoadTimer)
        startAnimations()
      } else {
        videoElement.addEventListener('loadeddata', () => {
          clearTimeout(videoLoadTimer)
          startAnimations()
        })
      }
    }

    // Cleanup
    return () => {
      clearTimeout(videoLoadTimer)
      videoElement?.removeEventListener('loadeddata', startAnimations)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [isHydrated])

  function scrollToSection(sectionId: string) {
    // Remove any leading # if present
    const targetId = sectionId.replace(/^#/, '');
    console.log('Looking for section with ID:', targetId);
    
    // Log all available section IDs first
    const allSections = document.querySelectorAll('section[id]');
    console.log('Available sections:', Array.from(allSections).map(section => ({
      id: section.id,
      visible: section instanceof HTMLElement ? section.offsetParent !== null : false,
      display: window.getComputedStyle(section).display
    })));
    
    // Try both with and without virtual- prefix
    let element = document.getElementById(targetId);
    if (!element && !targetId.startsWith('virtual-')) {
      const alternativeId = `virtual-${targetId}`;
      console.log('Element not found, trying alternative ID:', alternativeId);
      element = document.getElementById(alternativeId);
    }
    
    console.log('Found element:', element);
    if (element) {
      console.log('Scrolling to element...');
      element.scrollIntoView({ behavior: 'smooth' });
      return true;
    }
    
    console.warn(`No element found with id "${targetId}" or "virtual-${targetId}"`);
    return false;
  }

  return (
    <section className="relative h-screen w-full overflow-x-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        {videoUrl ? (
          <>
            <video
              className="absolute h-[100vh] w-full object-cover pointer-events-none"
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
              className="video-overlay absolute inset-0 bg-black/50 pointer-events-none" 
              style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} 
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-brand-dark pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col text-brand-light text-center px-4 sm:px-6 lg:px-12 z-10">
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

        {/* Top Section - Logo and Address */}
        <div ref={topSectionRef} className="mt-12 will-change-transform relative z-10 pointer-events-none">
          {/* Agency Logo */}
          <div ref={logoRef} className="hidden md:flex justify-center mb-4 pointer-events-none">
            {property.agency_settings?.branding?.logo?.light && (
              <Image
                src={property.agency_settings.branding.logo.light}
                alt={property.agency_name || 'Agency Logo'}
                width={200}
                height={50}
                className="h-auto w-auto object-contain"
                priority
              />
            )}
          </div>

          {/* Property Address */}
          <h2 ref={addressRef} className="text-lg sm:text-xl md:text-2xl font-light mb-2 text-brand-light pointer-events-none">{property.street_address}</h2>
          <h3 ref={suburbRef} className="text-2xl sm:text-3xl md:text-5xl font-light text-brand-light pointer-events-none">{property.suburb}</h3>
        </div>
        
        {/* Bottom Section - CTAs and Headlines */}
        <div className="mt-auto pb-16 sm:pb-20 relative z-10">
          {/* CTA Buttons */}
          <div ref={ctaContainerRef} className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 relative z-50">
            {/* Left slide effect button */}
            <button 
              ref={primaryBtnRef}
              type="button"
              style={{
                opacity: 0, // Start with opacity 0
                pointerEvents: isReady ? 'auto' : 'none' // Disable clicks until ready
              }}
              onClick={() => {
                console.log('Primary button clicked');
                const primaryBtn = property.metadata?.more_info?.ctaButtons?.primary;
                console.log('Primary button config:', primaryBtn);
                
                if (primaryBtn?.type === 'anchor' && primaryBtn.url) {
                  scrollToSection(primaryBtn.url);
                } else if (primaryBtn?.type === 'link' && primaryBtn.url) {
                  window.open(primaryBtn.url, '_blank');
                } else if (primaryBtn?.type === 'download' && primaryBtn.url) {
                  window.open(primaryBtn.url, '_self');
                }
              }}
              className={`${styles.slideEffect} px-8 py-3 text-brand-light bg-brand-dark active:translate-y-[3px] relative z-50 cursor-pointer`}
            >
              {property.metadata?.more_info?.ctaButtons?.primary?.label || 'Take a Tour'}
            </button>

            {/* Right slide effect button */}
            <button 
              ref={secondaryBtnRef}
              type="button"
              style={{
                opacity: 0, // Start with opacity 0
                pointerEvents: isReady ? 'auto' : 'none' // Disable clicks until ready
              }}
              onClick={() => {
                console.log('Secondary button clicked');
                const secondaryBtn = property.metadata?.more_info?.ctaButtons?.secondary;
                console.log('Secondary button config:', secondaryBtn);
                
                if (secondaryBtn?.type === 'anchor' && secondaryBtn.url) {
                  scrollToSection(secondaryBtn.url);
                } else if (secondaryBtn?.type === 'link' && secondaryBtn.url) {
                  window.open(secondaryBtn.url, '_blank');
                } else if (secondaryBtn?.type === 'download' && secondaryBtn.url) {
                  window.open(secondaryBtn.url, '_self');
                }
              }}
              className={`${styles.slideEffectReverse} px-8 py-3 text-brand-light active:translate-y-[3px] relative z-50 cursor-pointer`}
            >
              {property.metadata?.more_info?.ctaButtons?.secondary?.label || 'Book a Viewing'}
            </button>
          </div>

          {/* Headline and Subheadline */}
          <div className="pointer-events-none">
            <h1 ref={headlineRef} className="text-2xl sm:text-3xl md:text-5xl font-light mb-3 sm:mb-4 text-brand-light">
              {property.content.hero.headline}
            </h1>
            <p 
              ref={subheadlineRef} 
              className="text-lg sm:text-xl md:text-2xl font-light max-w-2xl mx-auto text-brand-light !pb-[80px]"
              style={{ paddingBottom: '80px' }}
            >
              {property.content.hero.subheadline}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}