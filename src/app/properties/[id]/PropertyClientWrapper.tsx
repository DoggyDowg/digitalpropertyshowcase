'use client'

import { useEffect, useState } from 'react'
import { CuscoTemplate } from '@/templates/cusco/page'
import { DubaiTemplate } from '@/templates/dubai/page'
import type { Property } from '@/types/property'
import type { Asset, PropertyAssets } from '@/types/assets'
import DynamicFavicon from '@/components/shared/DynamicFavicon'

// Add this new component for CSS-based styling
/**
 * StyleFixer Component
 * 
 * This component is responsible for dynamically injecting CSS hover effects
 * into the document based on the property's styling preferences.
 * 
 * HOVER EFFECT ARCHITECTURE:
 * 1. The hover effect system uses dynamic CSS injection rather than class-based approaches for:
 *    - Better performance (no DOM manipulations needed when hovering)
 *    - Consistent behavior across dynamically added elements
 *    - Centralized control over all hover effect behavior
 * 
 * 2. Flow of data:
 *    - Property styling preferences (stored in database) → Property object
 *    - Property object passed to StyleFixer component
 *    - StyleFixer reads the hoverEffect value from property.styling.textLinks.hoverEffect
 *    - StyleFixer injects the appropriate CSS based on the selected effect
 * 
 * 3. Available hover effects:
 *    - 'scale': Fill animation that slides up from the bottom
 *    - 'underline': Clean animated underline that reveals from left to right
 *    - 'slide': Background color transition that slides in from right
 *    - 'fade': Subtle opacity and color transition on hover
 *    - 'glow': Text glow effect using text-shadow and color transition
 * 
 * 4. Related files:
 *    - src/types/property.ts: Contains the HoverEffectType definition 
 *    - src/components/admin/PropertyStyling.tsx: Admin UI for selecting hover effects
 *    - src/styles/HoverEffects.module.css: CSS module for admin preview of effects
 * 
 * TO MODIFY EXISTING EFFECTS:
 * - Update the CSS string in the corresponding hoverEffect condition
 * - Ensure to maintain the same selectors (header a, section#hero a, etc.)
 * 
 * TO ADD A NEW EFFECT:
 * 1. Add the new effect type to HoverEffectType in src/types/property.ts
 * 2. Add a new entry to the HOVER_EFFECTS array in PropertyStyling.tsx
 * 3. Add the CSS for the new effect in this component
 * 4. Add the CSS preview in HoverEffects.module.css for the admin UI
 */
function StyleFixer({ property }: { property: Property }) {
  useEffect(() => {
    // Get the hover effect setting, with 'scale' as the default
    const hoverEffect = property.styling?.textLinks?.hoverEffect || 'scale';
    
    console.log('StyleFixer: Applying creative hover effect:', hoverEffect);
    
    // Create a style element to inject CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-hover-styles';
    
    // Remove any existing style element with the same ID to prevent duplication
    const existingStyle = document.getElementById('dynamic-hover-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create stylish CSS for hover effects
    let css = '';
    
    // Base styles for all links regardless of hover effect selection
    css += `
      /* Base styles for links */
      header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
        position: relative;
        z-index: 1;
        transition: color 0.3s;
        text-decoration: none;
      }
    `;
    
    // Apply the specific hover effect based on styling preference
    if (hoverEffect === 'scale') {
      css += `
        /* SHIFT hover effect - animated fill from bottom */
        header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
          position: relative;
          overflow: hidden;
          padding: 8px 12px;
          margin: -8px -12px;
          border-radius: 4px;
          display: inline-block;
        }
        
        header a::before, 
        section#hero a::before, 
        #info a::before, 
        a.dynamic-hover::before, 
        a[data-hover="true"]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          border-radius: 4px;
          opacity: 0.15;
          z-index: -1;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.17, 0.67, 0.38, 1.46), opacity 0.2s;
        }
        
        header a:hover::before, 
        section#hero a:hover::before, 
        #info a:hover::before, 
        a.dynamic-hover:hover::before, 
        a[data-hover="true"]:hover::before {
          transform: translateY(0);
          opacity: 0.15;
        }
      `;
    } else if (hoverEffect === 'underline') {
      css += `
        /* Underline Reveal effect - clean and minimal animated underline */
        header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
          position: relative;
          padding: 4px 2px;
          display: inline-block;
        }
        
        header a::after, 
        section#hero a::after, 
        #info a::after, 
        a.dynamic-hover::after, 
        a[data-hover="true"]::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: currentColor;
          transition: width 0.3s ease;
        }
        
        header a:hover::after, 
        section#hero a:hover::after, 
        #info a:hover::after, 
        a.dynamic-hover:hover::after, 
        a[data-hover="true"]:hover::after {
          width: 100%;
        }
      `;
    } else if (hoverEffect === 'slide') {
      css += `
        /* Slide Background effect - slides in from right */
        header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
          position: relative;
          overflow: hidden;
          padding: 8px 12px;
          margin: -8px -12px;
          border-radius: 4px;
          display: inline-block;
          z-index: 1;
        }
        
        header a::before, 
        section#hero a::before, 
        #info a::before, 
        a.dynamic-hover::before, 
        a[data-hover="true"]::before {
          content: '';
          position: absolute;
          top: 0;
          right: 100%;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          opacity: 0.15;
          transition: right 0.3s ease;
          z-index: -1;
          border-radius: 4px;
        }
        
        header a:hover::before, 
        section#hero a:hover::before, 
        #info a:hover::before, 
        a.dynamic-hover:hover::before, 
        a[data-hover="true"]:hover::before {
          right: 0;
        }
      `;
    } else if (hoverEffect === 'fade') {
      css += `
        /* Fade Effect - subtle opacity and color transition */
        header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
          position: relative;
          padding: 4px 2px;
          display: inline-block;
          opacity: 0.8;
          transition: opacity 0.3s ease, color 0.3s ease;
        }
        
        header a:hover, 
        section#hero a:hover, 
        #info a:hover, 
        a.dynamic-hover:hover, 
        a[data-hover="true"]:hover {
          opacity: 1;
          color: var(--brand-accent, #3b82f6);
        }
      `;
    } else if (hoverEffect === 'glow') {
      css += `
        /* Soft Glow effect - elegant glowing effect */
        header a, section#hero a, #info a, a.dynamic-hover, a[data-hover="true"] {
          position: relative;
          padding: 4px 2px;
          display: inline-block;
          transition: text-shadow 0.3s ease, color 0.3s ease;
        }
        
        header a:hover, 
        section#hero a:hover, 
        #info a:hover, 
        a.dynamic-hover:hover, 
        a[data-hover="true"]:hover {
          color: var(--brand-accent, currentColor);
          text-shadow: 0 0 8px var(--brand-accent-rgb, rgba(59, 130, 246, 0.5));
        }
      `;
    }
    
    // Special handling for document links with SVG icons - applies to all effects
    css += `
      /* Special handling for icon spacing in document links */
      #info a.dynamic-hover svg, 
      #info a[data-hover="true"] svg {
        margin-right: 6px;
      }
    `;
    
    // Set the CSS content
    styleEl.textContent = css;
    
    // Add the style element to the head
    document.head.appendChild(styleEl);
    
    // Cleanup function to remove the style element when the component unmounts
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [property.styling?.textLinks?.hoverEffect, property.styling]);
  
  return null;
}

interface PropertyClientWrapperProps {
  property: Property & { assets?: Asset[] }
  template: 'dubai' | 'cusco'
}

type ArrayCategories = 'gallery' | 'neighbourhood' | 'floorplan' | '3d_tour' | 'aerials';
type SingleCategories = 'hero_video' | 'your_home' | 'footer' | 'features_banner' | 
  'lifestyle_banner' | 'neighbourhood_banner' | 'property_logo' | 'og_image';

const ARRAY_CATEGORIES: ArrayCategories[] = ['gallery', 'neighbourhood', 'floorplan', '3d_tour', 'aerials'];

export function PropertyClientWrapper({ property, template }: PropertyClientWrapperProps) {
  // State to hold processed assets
  const [processedAssets, setProcessedAssets] = useState<PropertyAssets>({
    gallery: [],
    neighbourhood: [],
    floorplan: [],
    '3d_tour': [],
    aerials: []
  });

  // Process assets into the correct structure
  useEffect(() => {
    if (!property?.assets?.length) {
      setProcessedAssets({
        gallery: [],
        neighbourhood: [],
        floorplan: [],
        '3d_tour': [],
        aerials: []
      });
      return;
    }

    // Group assets by category
    const groupedAssets = property.assets.reduce((acc: Partial<PropertyAssets>, asset: Asset) => {
      const category = asset.category;
      
      // Handle array categories
      if (ARRAY_CATEGORIES.includes(category as ArrayCategories)) {
        const arrayCategory = category as ArrayCategories;
        const existingArray = acc[arrayCategory] || [];
        acc[arrayCategory] = [...existingArray, asset];
      } else {
        // Handle single item categories
        const singleCategory = category as SingleCategories;
        acc[singleCategory] = asset;
      }
      return acc;
    }, {
      gallery: [],
      neighbourhood: [],
      floorplan: [],
      '3d_tour': [],
      aerials: []
    } as Partial<PropertyAssets>) as PropertyAssets;

    setProcessedAssets(groupedAssets);
  }, [property?.assets]);

  // Create a new property object with processed assets
  const propertyWithProcessedAssets = {
    ...property,
    assets: processedAssets
  };

  // Get the favicon URL from the property's agency settings
  const faviconUrl = property?.agency_settings?.branding?.favicon;
  
  // Ensure favicon URL is absolute
  const baseUrl = property?.custom_domain || 
                  property?.deployment_url || 
                  process.env.NEXT_PUBLIC_BASE_URL || 
                  'https://digipropshow.com';
                  
  const absoluteFaviconUrl = faviconUrl 
    ? (faviconUrl.startsWith('http') ? faviconUrl : `https://${baseUrl.replace(/^https?:\/\//, '')}${faviconUrl}`)
    : undefined;

  return (
    <>
      <StyleFixer property={property} />
      <DynamicFavicon faviconUrl={absoluteFaviconUrl} />
      
      {template === 'dubai' ? (
        <DubaiTemplate property={propertyWithProcessedAssets} />
      ) : (
        <CuscoTemplate property={propertyWithProcessedAssets} />
      )}
    </>
  );
} 