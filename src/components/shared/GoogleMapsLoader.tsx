'use client'

import { useEffect, useState } from 'react'

// Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface GoogleMapsLoaderState {
  isLoaded: boolean
  loadError: Error | null
}

declare global {
  interface Window {
    initMap?: () => void;
  }
}

export function useGoogleMaps(useBeta = false) {
  const [state, setState] = useState<GoogleMapsLoaderState>({
    isLoaded: false,
    loadError: null,
  })

  useEffect(() => {
    // Skip if already loaded
    if (typeof window !== 'undefined' && 
        window.google && 
        typeof window.google.maps !== 'undefined' && 
        'importLibrary' in window.google.maps) {
      setState({ isLoaded: true, loadError: null })
      return
    }

    // Define the callback function
    window.initMap = () => {
      setState({ isLoaded: true, loadError: null })
    }

    // Create script element
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=initMap&libraries=places${useBeta ? '&v=beta' : ''}`
    script.async = true
    script.defer = true

    // Handle errors
    script.onerror = () => {
      setState({
        isLoaded: false,
        loadError: new Error('Failed to load Google Maps API'),
      })
    }

    // Add script to DOM
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      // Remove the global callback
      if (window.initMap) {
        delete window.initMap
      }
    }
  }, [useBeta])

  return state
} 