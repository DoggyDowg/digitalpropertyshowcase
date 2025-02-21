export type AssetCategory = 'hero_video' | 'promo_video' | 'gallery' | 'your_home' | 'neighbourhood' | 'footer' | 'floorplan' | 
  'features_banner' | 'lifestyle_banner' | 'neighbourhood_banner' | 'property_logo' | '3d_tour' | 'aerials' | 'og_image';
export type AssetType = 'image' | 'video' | 'pdf' | 'glb';

export interface Asset {
  id: string;
  property_id: string;
  created_at: string;
  updated_at: string;
  
  // Asset Information
  category: AssetCategory;
  type: AssetType;
  filename: string;
  storage_path: string;
  
  // Optional Metadata
  title?: string;
  description?: string;
  alt_text?: string;
  
  // Display Order (for galleries)
  display_order?: number;
  
  // Video specific metadata
  video_thumbnail_path?: string;
  video_duration?: number;
  
  // Image specific metadata
  width?: number;
  height?: number;
  
  // Status
  status: 'active' | 'inactive';
}

// Helper type for creating a new asset
export type NewAsset = Omit<Asset, 'id' | 'created_at' | 'updated_at'>;

// Grouped assets by category
export interface PropertyAssets {
  hero_video?: Asset;
  promo_video?: Asset;
  gallery: Asset[];
  your_home?: Asset;
  neighbourhood: Asset[];
  footer?: Asset;
  floorplan: Asset[];
  features_banner?: Asset;
  lifestyle_banner?: Asset;
  neighbourhood_banner?: Asset;
  property_logo?: Asset;
  '3d_tour': Asset[];
  aerials: Asset[];
  og_image?: Asset;
}

// Configuration for each asset category
export const ASSET_CATEGORY_CONFIG: Record<AssetCategory, {
  label: string;
  maxFiles: number;
  acceptedTypes: AssetType[];
  required: boolean;
  description: string;
  directory: string;
}> = {
  hero_video: {
    label: 'Hero Video',
    maxFiles: 1,
    acceptedTypes: ['video'],
    required: true,
    description: 'The main video shown in the hero section',
    directory: 'hero_transition'
  },
  promo_video: {
    label: 'Promo Video',
    maxFiles: 1,
    acceptedTypes: ['video'],
    required: false,
    description: 'The main video shown in the promo section',
    directory: 'promo_transition'
  },
  gallery: {
    label: 'Gallery',
    maxFiles: 30,
    acceptedTypes: ['image'],
    required: true,
    description: 'Images shown in the gallery sections (Transition Gallery and Your Lifestyle)',
    directory: 'gallery'
  },
  your_home: {
    label: 'Your Home',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: true,
    description: 'The main image shown in the Your Home section',
    directory: 'sections'
  },
  neighbourhood: {
    label: 'Neighbourhood',
    maxFiles: 3,
    acceptedTypes: ['image'],
    required: true,
    description: 'Images shown in the Your Neighbourhood section',
    directory: 'sections'
  },
  footer: {
    label: 'Footer',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: true,
    description: 'The image shown in the footer',
    directory: 'footer'
  },
  floorplan: {
    label: 'Floorplan',
    maxFiles: 4,
    acceptedTypes: ['image', 'pdf'],
    required: false,
    description: 'Property floorplan images or PDFs shown in the More Info section (up to 4). Accepts JPG, PNG, or PDF files.',
    directory: 'sections'
  },
  features_banner: {
    label: 'Features Banner Background',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: false,
    description: 'Background image for the Features section banner',
    directory: 'banners'
  },
  lifestyle_banner: {
    label: 'Lifestyle Banner Background',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: false,
    description: 'Background image for the Lifestyle section banner',
    directory: 'banners'
  },
  neighbourhood_banner: {
    label: 'Neighbourhood Banner Background',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: false,
    description: 'Background image for the Neighbourhood section banner',
    directory: 'banners'
  },
  property_logo: {
    label: 'Property Logo',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: false,
    description: 'Property logo (must be PNG with transparent background, optimized for light backgrounds)',
    directory: 'logos'
  },
  '3d_tour': {
    label: 'Virtual Tour',
    maxFiles: 10,
    acceptedTypes: ['glb'],
    required: false,
    description: 'GLB files for 3D virtual tours (up to 10 files)',
    directory: '3d_tours'
  },
  aerials: {
    label: 'Aerial Images',
    maxFiles: 10,
    acceptedTypes: ['image'],
    required: false,
    description: 'Aerial photographs of the property and surroundings',
    directory: 'aerials'
  },
  og_image: {
    label: 'Social Sharing Image',
    maxFiles: 1,
    acceptedTypes: ['image'],
    required: false,
    description: 'Image optimized for social media sharing (1200x630px recommended)',
    directory: 'og_image'
  }
}; 