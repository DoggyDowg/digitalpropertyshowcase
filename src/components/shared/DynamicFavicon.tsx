'use client';

import { useEffect } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string;
}

/**
 * Client-side component to ensure the favicon is set correctly
 * This is a fallback mechanism in case the metadata API doesn't work as expected
 */
export default function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return;

    // Function to set favicon
    const setFavicon = (url: string) => {
      // Remove any existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon links
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      document.head.appendChild(link);

      // Also set shortcut icon
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.href = url;
      document.head.appendChild(shortcutLink);

      // Also set apple-touch-icon
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = url;
      document.head.appendChild(appleLink);

      console.log('Dynamic favicon set to:', url);
    };

    // Set the favicon
    setFavicon(faviconUrl);

    // Check if favicon is actually set after a short delay
    setTimeout(() => {
      const currentFavicon = document.querySelector('link[rel*="icon"]')?.getAttribute('href');
      if (currentFavicon !== faviconUrl) {
        console.warn('Favicon not set correctly, trying again');
        setFavicon(faviconUrl);
      }
    }, 1000);

  }, [faviconUrl]);

  // This component doesn't render anything
  return null;
} 