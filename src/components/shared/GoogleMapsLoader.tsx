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
    google?: any;
  }
}

export function useGoogleMaps(useBeta = false) {
  const [state, setState] = useState<GoogleMapsLoaderState>({
    isLoaded: false,
    loadError: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('[GoogleMapsLoader] Initializing with status:', { 
      alreadyLoaded: window.google && typeof window.google.maps !== 'undefined',
      scriptExists: !!document.getElementById('google-maps-script') 
    });

    // Check if already loaded
    if (window.google && 
        typeof window.google.maps !== 'undefined' && 
        typeof window.google.maps.importLibrary === 'function') {
      console.log('[GoogleMapsLoader] Google Maps already loaded, skipping initialization');
      setState({ isLoaded: true, loadError: null });
      return;
    }

    // Check if script is already added but not loaded yet
    if (document.getElementById('google-maps-script')) {
      console.log('[GoogleMapsLoader] Script tag already exists, waiting for load');
      // Define callback if not already defined
      if (!window.initMap) {
        window.initMap = () => {
          console.log('[GoogleMapsLoader] Google Maps loaded via existing script tag');
          setState({ isLoaded: true, loadError: null });
        };
      }
      return;
    }

    // Define the callback function
    window.initMap = () => {
      console.log('[GoogleMapsLoader] Google Maps loaded successfully');
      setState({ isLoaded: true, loadError: null });
    };

    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=initMap&libraries=places${useBeta ? '&v=beta' : ''}`;
    script.async = true;
    script.defer = true;

    // Handle errors
    script.onerror = (event) => {
      console.error('[GoogleMapsLoader] Failed to load Google Maps API', event);
      setState({
        isLoaded: false,
        loadError: new Error('Failed to load Google Maps API'),
      });
    };

    // Add script to DOM
    console.log('[GoogleMapsLoader] Adding script tag to document head');
    document.head.appendChild(script);

    // Additional check for timeout
    const timeoutId = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.error('[GoogleMapsLoader] Google Maps failed to load after timeout');
        setState({
          isLoaded: false,
          loadError: new Error('Google Maps failed to load within timeout period'),
        });
      }
    }, 10000); // 10 second timeout

    // Cleanup on unmount
    return () => {
      console.log('[GoogleMapsLoader] Cleaning up');
      // Remove the global callback
      if (window.initMap) {
        delete window.initMap;
      }
      clearTimeout(timeoutId);
      // Don't remove the script tag as it might be used by other components
    };
  }, [useBeta]);

  return state;
} 