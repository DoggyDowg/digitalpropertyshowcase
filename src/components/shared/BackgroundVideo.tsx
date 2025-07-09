import { useHeroVideo } from '@/hooks/useHeroVideo'
import type { Property } from '@/types/property'
import { useState } from 'react'

interface BackgroundVideoProps {
  property: Property
}

export function BackgroundVideo({ property }: BackgroundVideoProps) {
  const [videoErrored, setVideoErrored] = useState(false)
  
  // For demo properties, use the full path to the demo video
  const heroVideoPath = property.is_demo 
    ? 'demo/hero_video/hero.mp4'
    : property.id
  const { videoUrl } = useHeroVideo(heroVideoPath)

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
        className="absolute h-[100vh] w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        style={{ position: 'fixed', top: 0, left: 0, zIndex: -2 }}
        onError={(e) => {
          console.error('BackgroundVideo: Video error:', e)
          setVideoErrored(true)
        }}
        onLoadedData={() => {
          // Video loaded successfully
        }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {/* Video overlay for fade effect */}
      <div 
        className="video-overlay absolute inset-0 bg-black/50" 
        style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} 
      />
    </div>
  )
} 