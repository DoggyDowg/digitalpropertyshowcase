import { useHeroVideo } from '@/hooks/useHeroVideo'
import type { Property } from '@/types/property'

interface BackgroundVideoProps {
  property: Property
}

export function BackgroundVideo({ property }: BackgroundVideoProps) {
  // For demo properties, use the full path to the demo video
  const heroVideoPath = property.is_demo 
    ? 'demo/hero_video/hero.mp4'
    : property.id
  const { videoUrl } = useHeroVideo(heroVideoPath)

  if (!videoUrl) return null

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