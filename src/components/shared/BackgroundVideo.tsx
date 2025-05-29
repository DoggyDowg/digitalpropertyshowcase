import { useHeroVideo } from '@/hooks/useHeroVideo'
import type { Property } from '@/types/property'
import { useEffect, useState } from 'react'

interface BackgroundVideoProps {
  property: Property
}

export function BackgroundVideo({ property }: BackgroundVideoProps) {
  const [videoErrored, setVideoErrored] = useState(false)
  
  // For demo properties, use the full path to the demo video
  const heroVideoPath = property.is_demo 
    ? 'demo/hero_video/hero.mp4'
    : property.id
  const { videoUrl, loading, error } = useHeroVideo(heroVideoPath)

  useEffect(() => {
    console.log('BackgroundVideo Component:')
    console.log('  - Property ID:', property.id)
    console.log('  - Is Demo:', property.is_demo)
    console.log('  - Hero Video Path:', heroVideoPath)
    console.log('  - Video URL:', videoUrl)
    console.log('  - Loading:', loading)
    console.log('  - Error:', error)
    console.log('  - Video Errored:', videoErrored)
  }, [property.id, property.is_demo, heroVideoPath, videoUrl, loading, error, videoErrored])

  // If there's no video URL or there was an error loading the video, show an empty container
  if (!videoUrl || videoErrored) {
    console.log('BackgroundVideo: No video available, showing empty background')
    return (
      <div className="fixed inset-0 overflow-hidden -z-10">
        {/* Overlay for fade effect */}
        <div 
          className="video-overlay absolute inset-0 bg-black/50" 
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
        onLoadedData={() => console.log('BackgroundVideo: Video loaded successfully')}
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