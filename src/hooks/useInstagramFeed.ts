import { useState, useEffect } from 'react'
import type { InstagramMedia } from '@/types/instagram'

interface UseInstagramFeedProps {
  hashtagId: string
  refreshInterval?: number
}

interface UseInstagramFeedReturn {
  posts: InstagramMedia[]
  isLoading: boolean
  error: Error | null
  refreshFeed: () => Promise<void>
}

export function useInstagramFeed({ 
  hashtagId, 
  refreshInterval = 300000 // 5 minutes default
}: UseInstagramFeedProps): UseInstagramFeedReturn {
  const [posts, setPosts] = useState<InstagramMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/instagram?hashtagId=${hashtagId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Instagram posts')
      }

      const { data } = await response.json()
      setPosts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()

    // Set up periodic refresh
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchPosts, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [hashtagId, refreshInterval])

  return {
    posts,
    isLoading,
    error,
    refreshFeed: fetchPosts
  }
} 