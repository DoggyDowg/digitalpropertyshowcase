'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { HeaderLink } from '@/components/shared/HeaderLink'
import { MobileMenu } from '@/components/shared/MobileMenu'
import { usePropertyLogo } from '@/hooks/usePropertyLogo'
import { TrackedImage } from '@/components/shared/AssetTracker'
import styles from '@/styles/Header.module.css'
import type { Property } from '@/types/property'

const LOGO_HEIGHT = 44
const MAX_LOGO_WIDTH = 200

interface HeaderProps {
  property: Property
}

export function Header({ property }: HeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logoUrl } = usePropertyLogo(property.id, property.is_demo)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      // Show header after scrolling 100px
      const shouldShow = window.scrollY > 100
      setIsVisible(shouldShow)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  return (
    <header className={`${styles.header} ${isVisible ? styles.visible : ''} relative z-[100]`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative flex items-center justify-between h-20">
          {/* Left Navigation Group */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <HeaderLink href="#features">Features</HeaderLink>
            <HeaderLink href="#lifestyle">Lifestyle</HeaderLink>
            <HeaderLink href="#neighbourhood">Neighbourhood</HeaderLink>
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <Link href="/" prefetch={false} className="block">
              {logoUrl ? (
                <TrackedImage
                  src={logoUrl}
                  alt={`${property.agency_name} Logo`}
                  width={MAX_LOGO_WIDTH}
                  height={LOGO_HEIGHT}
                  priority
                  className="object-contain w-auto h-[44px]"
                />
              ) : (
                <div 
                  className="bg-gray-200 flex items-center justify-center h-[44px]"
                  style={{ width: MAX_LOGO_WIDTH }}
                >
                  <span className="text-gray-400 text-sm">Logo not found</span>
                </div>
              )}
            </Link>
          </div>

          {/* Right Navigation Group */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <HeaderLink href="#info">Info</HeaderLink>
            <HeaderLink href="#viewings">Viewings</HeaderLink>
            <HeaderLink href="#contact">Make an Enquiry</HeaderLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              type="button"
              aria-label="Menu"
              className="p-2 relative z-20"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <svg 
                className="w-6 h-6 text-brand-dark"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        menuItems={[
          { label: 'Features', href: '#features' },
          { label: 'Lifestyle', href: '#lifestyle' },
          { label: 'Neighbourhood', href: '#neighbourhood' },
          { label: 'Info', href: '#info' },
          { label: 'Viewings', href: '#viewings' },
          { label: 'Make an Enquiry', href: '#contact' },
        ]}
        property={property}
      />
    </header>
  )
}
