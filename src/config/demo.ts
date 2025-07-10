export const DEMO_CONFIG = {
  // Demo property detection
  isDemoProperty: (propertyId: string | undefined, isDemo?: boolean): boolean => {
    if (!propertyId) return false
    return Boolean(isDemo) || propertyId.includes('demo/') || propertyId.includes('/demo/')
  },

  // Demo asset paths - these match the actual storage structure
  assets: {
    hero_video: 'demo/hero_video/hero.mp4',
    features_banner: 'demo/features_banner/banner.jpg',
    lifestyle_banner: 'demo/lifestyle_banner/banner.jpg', 
    neighbourhood_banner: 'demo/neighbourhood_banner/banner.jpg',
    yourhome_banner: 'demo/your_home/image.jpg',
    footer_image: 'demo/footer/image.jpg',
    // Use existing property logo as demo logo since demo logo doesn't exist
    property_logo: '57b83e7d-4cea-4245-a470-151a517fd62f/logos/colella_dps_logo_1_.png',
    gallery: Array.from({ length: 30 }, (_, i) => `demo/gallery/Fleetwood 61-${i + 1}.jpg`),
    neighbourhood: Array.from({ length: 3 }, (_, i) => `demo/neighbourhood/image${i + 1}.jpg`),
    aerials: Array.from({ length: 6 }, (_, i) => `demo/aerial/${i + 1}.jpg`),
    tour_3d: 'demo/3d-tour/tour.html'
  },

  // Supported image formats for fallback
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],

  // Demo content data
  content: {
    viewings: [
      { viewing_datetime: new Date('2026-03-08T09:30:00').toISOString() },
      { viewing_datetime: new Date('2026-03-09T14:00:00').toISOString() },
      { viewing_datetime: new Date('2026-03-10T11:30:00').toISOString() }
    ],
    documents: [
      { label: 'Statement of Information', url: '#' },
      { label: 'Contract of Sale', url: '#' }
    ],
    additionalInfo: [
      { info: 'Council Rates', detail: '$2,600 per annum' },
      { info: 'Body Corp', detail: '$460 per qtr' }
    ]
  }
}

// Utility function to get demo asset URL with format fallback
export async function getDemoAssetUrl(
  supabase: any,
  assetPath: string,
  supportedFormats: string[] = DEMO_CONFIG.supportedFormats
): Promise<string | null> {
  // First try the exact path
  const { data: publicUrlData } = supabase.storage
    .from('property-assets')
    .getPublicUrl(assetPath)

  if (publicUrlData?.publicUrl) {
    try {
      const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
      if (response.ok) {
        return publicUrlData.publicUrl
      }
    } catch {
      // Continue to format fallback
    }
  }

  // Try different formats
  const basePath = assetPath.replace(/\.[^/.]+$/, '')
  
  for (const format of supportedFormats) {
    try {
      const fallbackPath = `${basePath}.${format}`
      
      const { data } = supabase.storage
        .from('property-assets')
        .getPublicUrl(fallbackPath)

      if (data?.publicUrl) {
        const response = await fetch(data.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          return data.publicUrl
        }
      }
    } catch {
      // Continue to next format
    }
  }

  return null
} 