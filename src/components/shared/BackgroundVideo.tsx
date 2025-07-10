import { useState } from 'react'
import { useHeroVideo } from '@/hooks/useHeroVideo'
import type { Property } from '@/types/property'

interface BackgroundVideoProps {
  property: Property
}

export function BackgroundVideo({ property }: BackgroundVideoProps) {
  const [videoErrored, setVideoErrored] = useState(false)
  
  // Use the property's demo status directly
  const { videoUrl } = useHeroVideo(property.id, property.is_demo)

  // If there's no video URL or there was an error loading the video, show a fallback background
  if (!videoUrl || videoErrored) {
    // For demo properties, show a subtle gradient background instead of grey
    const fallbackStyle = property.is_demo ? {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    } : {
      background: 'rgba(0, 0, 0, 0.1)',
    }

    return (
      <div className="fixed inset-0 overflow-hidden -z-10">
        {/* Fallback background */}
        <div 
          className="absolute inset-0" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: -2,
            ...fallbackStyle
          }} 
        />
        {/* Overlay for fade effect */}
        <div 
          className="video-overlay absolute inset-0 bg-black/30" 
          style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} 
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="min-w-full min-h-full object-cover"
        style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }}
        onError={() => setVideoErrored(true)}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {/* Overlay for fade effect */}
      <div 
        className="video-overlay absolute inset-0 bg-black/30" 
        style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} 
      />
    </div>
  )
} 