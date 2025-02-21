'use client'

import { useEffect, useState } from 'react'
import { CuscoTemplate } from '@/templates/cusco/page'
import { DubaiTemplate } from '@/templates/dubai/page'
import type { Property } from '@/types/property'
import type { Asset, PropertyAssets } from '@/types/assets'

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

  return template === 'dubai' ? (
    <DubaiTemplate property={propertyWithProcessedAssets} />
  ) : (
    <CuscoTemplate property={propertyWithProcessedAssets} />
  );
} 