'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGesture } from '@/hooks/useGesture'
import { useProperty } from '@/contexts/PropertyContext'
import styles from '@/styles/HeaderLink.module.css'

interface HeaderLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  isDarkHeader?: boolean
}

export function HeaderLink({ 
  href, 
  children, 
  className = '', 
  onClick,
  isDarkHeader = false
}: HeaderLinkProps) {
  const [isPressed, setIsPressed] = useState(false)
  
  // Get property from context - hooks must be called unconditionally
  const { property } = useProperty();
  
  // Get hover effect preference from property styling with fallback
  const hoverEffect = property?.styling?.textLinks?.hoverEffect || 'scale';
  
  // Debug for Vercel preview
  /* console.log('HeaderLink received property from context:', {
    propertyId: property?.id,
    hoverEffect,
    hasPropertyObject: !!property
  }); */
  
  // Add debugging
  /* useEffect(() => {
    console.log('HeaderLink Component:', {
      href,
      isDarkHeader,
      hoverEffect,
    })
  }, [href, isDarkHeader, hoverEffect]) */
  
  const gestureRef = useGesture({
    onPress: () => setIsPressed(true),
    onPressUp: () => setIsPressed(false),
    onTap: () => {
      if (href.startsWith('#')) {
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  })

  const isHashLink = href.startsWith('#')

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHashLink) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    if (onClick) {
      onClick(e)
    }
  }

  // Set base classes for all links, including the hover effect class
  const linkClassName = `${styles.link} ${className} dynamic-hover ${hoverEffect}-hover`

  // Hash link implementation
  if (isHashLink) {
    return (
      <a 
        href={href} 
        className={linkClassName}
        onClick={handleClick}
        data-hover="true"
        data-in-header="true"
        data-dark-header={isDarkHeader ? 'true' : 'false'}
        data-hover-effect={hoverEffect}
      >
        {children}
      </a>
    )
  }

  // Regular link implementation
  return (
    <Link
      href={href}
      ref={(node: HTMLAnchorElement | null) => { 
        gestureRef.current = node as HTMLAnchorElement | null
      }}
      className={`${linkClassName} ${isPressed ? 'scale-95' : 'scale-100'} transition-transform duration-150`}
      onClick={onClick}
      data-hover="true"
      data-in-header="true"
      data-dark-header={isDarkHeader ? 'true' : 'false'}
      data-hover-effect={hoverEffect}
    >
      {children}
    </Link>
  )
}