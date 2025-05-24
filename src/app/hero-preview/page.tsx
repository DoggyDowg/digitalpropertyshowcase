'use client'; // Mark as a Client Component

import { useState, useEffect } from 'react'; // Added for client-side data fetching
import { Hero } from '@/components/Hero';
import { getProperty } from '@/utils/propertyUtils';
import type { Property } from '@/types/property';
import { PropertyProvider } from '@/contexts/PropertyContext';
import { AssetLoadingProvider } from '@/contexts/AssetLoadingContext';
import { BrandColorInitializer } from '@/components/BrandColorInitializer';
import { BrandFontInitializer } from '@/components/BrandFontInitializer';
import { BackgroundVideo } from '@/components/shared/BackgroundVideo';

export default function HeroPreviewPage() {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const propertyId = 'e448ab43-6a90-4843-bcf7-80d5db74f28c'; // 1 Dromana Ave
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedProperty = await getProperty(propertyId);
        if (fetchedProperty) {
          setProperty(fetchedProperty);
        } else {
          setError('Property data not found.');
        }
      } catch (e: any) {
        console.error('[HeroPreviewPage] Error fetching property:', e);
        setError(e.message || 'Error fetching property.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'transparent' }}>
        {/* Text removed as per user request. SVG loader in index.html will handle visual loading state. */}
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: 'rgba(0,0,0,0.1)' 
      }}>
        <p>{error || 'Property data not found for ID: e448ab43-6a90-4843-bcf7-80d5db74f28c'}</p>
      </div>
    );
  }

  return (
    <AssetLoadingProvider>
      <PropertyProvider initialProperty={property as Property}> 
        <BrandColorInitializer property={property as Property} /> 
        <BrandFontInitializer property={property as Property} /> 
        <BackgroundVideo property={property as Property} /> 
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          overflow: 'hidden', 
          backgroundColor: 'transparent',
          position: 'relative', 
          zIndex: 1 
        }}>
          <Hero property={property as Property} />
        </div>
      </PropertyProvider>
    </AssetLoadingProvider>
  );
}

// Optional: Add a basic layout if your Hero component relies on it
// export async function generateMetadata() {
//   const propertyId = 'e448ab43-6a90-4843-bcf7-80d5db74f28c';
//   const property = await getProperty(propertyId);
//   return {
//     title: property ? `${property.street_address} - Preview` : 'Property Preview',
//   };
// } 