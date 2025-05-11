import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import paginationStyles from '@/styles/Pagination.module.css'

interface FullscreenGalleryProps {
  images: Array<{ src: string; alt: string }>
  initialIndex: number
  onClose: () => void
}

export function FullscreenGallery({ images, initialIndex, onClose }: FullscreenGalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(initialIndex)
  const [transitionClass, setTransitionClass] = useState<'transitionPrev' | 'transitionNext' | ''>('')
  const [mounted, setMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
    
    // Cleanup function
    return () => {
      setMounted(false)
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Handle escape key to close and manage body scroll
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow
    
    // Disable scrolling
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    // Add event listener
    window.addEventListener('keydown', handleEscape)

    // Cleanup function
    return () => {
      // Remove event listener
      window.removeEventListener('keydown', handleEscape)
      
      // Only restore body style if we're still mounted
      try {
        // Restore scrolling - wrapped in try/catch in case body is not available
        document.body.style.overflow = originalOverflow
      } catch (e) {
        console.error('Error restoring body overflow:', e)
      }
    }
  }, [onClose])

  const handleSlideTransition = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? currentSlide === 0 ? images.length - 1 : currentSlide - 1
      : (currentSlide + 1) % images.length

    setCurrentSlide(newIndex)
  }

  const handlePagination = (direction: 'prev' | 'next') => {
    setTransitionClass(direction === 'prev' ? 'transitionPrev' : 'transitionNext')
    
    // Store timeout reference so we can clear it if component unmounts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setTransitionClass('')
      timeoutRef.current = null
    }, 500)
  }

  // Only prepare portal content if we're mounted
  if (!mounted) return null

  // Create the gallery content
  const galleryContent = (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Blurred background */}
      <div 
        className="absolute inset-0 bg-brand-dark/75 backdrop-blur-xl"
        style={{
          backgroundImage: `url(${images[currentSlide].src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.4)',
        }}
      />

      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-brand-light p-2 hover:bg-brand-light/10 rounded-full transition-colors z-10"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main content */}
      <div className="relative w-full h-[80vh] max-w-7xl px-4 pb-8">
        <div className={paginationStyles.sliderContainer}>
          <div 
            className={paginationStyles.slideTrack}
            style={{ 
              transform: `translateX(-${currentSlide * 100}%)` 
            }}
          >
            {images.map((image, index) => (
              <div key={index} className={paginationStyles.slide}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image Counter */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-brand-light bg-brand-dark/50 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentSlide + 1} / {images.length}
        </div>

        {/* Custom Pagination */}
        <div className={`${paginationStyles.paginationWrapper} ${transitionClass ? paginationStyles[transitionClass] : ''} pb-5`}>
          {/* Prev Button */}
          <svg 
            className={paginationStyles.btn} 
            height="48" 
            viewBox="0 0 24 24" 
            width="48" 
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => {
              handleSlideTransition('prev')
              handlePagination('prev')
            }}
          >
            <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/>
          </svg>

          <div className={paginationStyles.paginationContainer}>
            <div className={`${paginationStyles.littleDot} ${paginationStyles.littleDotFirst}`} />
            <div className={paginationStyles.littleDot}>
              <div className={paginationStyles.bigDotContainer}>
                <div className={paginationStyles.bigDot} />
              </div>
            </div>
            <div className={`${paginationStyles.littleDot} ${paginationStyles.littleDotLast}`} />
          </div>

          {/* Next Button */}
          <svg 
            className={paginationStyles.btn} 
            height="48" 
            viewBox="0 0 24 24" 
            width="48" 
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => {
              handleSlideTransition('next')
              handlePagination('next')
            }}
          >
            <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/>
          </svg>
        </div>
      </div>
    </div>
  )

  // Use try-catch for the portal creation to handle any DOM-related errors
  try {
    return createPortal(galleryContent, document.body)
  } catch (e) {
    console.error('Error creating portal for FullscreenGallery:', e)
    return null
  }
} 