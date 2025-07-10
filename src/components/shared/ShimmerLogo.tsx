'use client'

import Image from 'next/image'

interface ShimmerLogoProps {
  className?: string
}

export function ShimmerLogo({ className = '' }: ShimmerLogoProps) {
  return (
    <div className={`shimmer-logo-container ${className}`}>
      <div className="shimmer-logo-wrapper">
        <Image
          src="/assets/logo/logo_lightgb.png"
          alt="Digital Property Showcase"
          width={160}
          height={60}
          className="shimmer-logo"
          priority
        />
      </div>
    </div>
  )
} 