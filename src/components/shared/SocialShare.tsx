'use client'

import { useState } from 'react'

interface SocialShareProps {
  title: string
  description?: string
  url: string
  hashtags?: string[]
  image?: string
}

export default function SocialShare({ 
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Check out this amazing property!',
  description = 'Discover your dream home with amazing features and lifestyle options.',
  hashtags = ['RealEstate'],
  image
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const openShareWindow = (shareUrl: string, label: string) => {
    const width = 600
    const height = 400
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    window.open(
      shareUrl,
      `Share on ${label}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    )
    setIsOpen(false)
    setIsSent(true)
    setTimeout(() => setIsSent(false), 2000)
  }

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(description)}${image ? `&picture=${encodeURIComponent(image)}` : ''}`
    openShareWindow(fbUrl, 'Facebook')
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&hashtags=${hashtags?.join(',')}`
    openShareWindow(twitterUrl, 'Twitter')
  }

  const handleWhatsAppShare = () => {
    const whatsappText = `${title}\n\n${description}\n\n${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    openShareWindow(whatsappUrl, 'WhatsApp')
  }

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    openShareWindow(linkedInUrl, 'LinkedIn')
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this property`)
    const body = encodeURIComponent(`I thought you might be interested in this property: ${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIsSent(true)
      setTimeout(() => setIsSent(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  const toggleShare = () => {
    if (isMobile() && navigator.share) {
      navigator.share({
        title,
        text: description,
        url
      }).catch(() => {
        setIsOpen(!isOpen)
      })
    } else {
      setIsOpen(!isOpen)
    }
    if (isSent) setIsSent(false)
  }

  // Common classes for social buttons
  const socialButtonClasses = `inline-flex items-center justify-center w-10 h-10 p-0 rounded-full bg-white shadow-md transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-lg ${
    isOpen
      ? 'opacity-100 scale-100 translate-y-0'
      : 'w-0 h-0 opacity-0 scale-0 -translate-y-2'
  }`

  return (
    <div className="flex items-center gap-3">
      {/* Main Share Button */}
      <button
        onClick={toggleShare}
        className={`relative inline-flex items-center justify-center w-12 h-12 p-0 rounded-full bg-white shadow-md transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
          isOpen ? 'open' : ''
        } ${isSent ? 'sent' : ''}`}
      >
        {/* Share Icon */}
        <svg
          className={`w-8 h-8 transition-all duration-150 ${
            isOpen || isSent ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z" />
        </svg>
        {/* Close Icon */}
        <svg
          className={`absolute inset-0 m-auto w-8 h-8 transition-all duration-150 ${
            isOpen && !isSent ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
        {/* Check Icon */}
        <svg
          className={`absolute inset-0 m-auto w-8 h-8 transition-all duration-150 ${
            isSent ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
        </svg>
      </button>

      {/* Facebook Share Button */}
      <button
        onClick={handleFacebookShare}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '0ms' : '100ms' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
        </svg>
      </button>

      {/* Twitter Share Button */}
      <button
        onClick={handleTwitterShare}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '50ms' : '80ms' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#000000">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* WhatsApp Share Button */}
      <button
        onClick={handleWhatsAppShare}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '100ms' : '60ms' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
        </svg>
      </button>

      {/* LinkedIn Share Button */}
      <button
        onClick={handleLinkedInShare}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '150ms' : '40ms' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </button>

      {/* Email Share Button */}
      <button
        onClick={handleEmailShare}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '200ms' : '20ms' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#4A5568">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={socialButtonClasses}
        style={{ transitionDelay: isOpen ? '250ms' : '0ms' }}
      >
        {isSent ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#10B981">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  )
} 