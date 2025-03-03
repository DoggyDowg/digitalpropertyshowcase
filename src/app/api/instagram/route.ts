import { NextResponse, NextRequest } from 'next/server'
import type { InstagramMedia, InstagramHashtagResponse, InstagramError } from '@/types/instagram'

const INSTAGRAM_API_URL = 'https://graph.instagram.com'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// In-memory cache (consider using Redis or similar for production)
const cache: Record<string, { data: InstagramMedia[]; timestamp: number }> = {}

async function fetchInstagramPosts(hashtagId: string): Promise<InstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('Instagram access token not configured')
  }

  // Check cache first
  const cacheKey = `hashtag_${hashtagId}`
  const cachedData = cache[cacheKey]
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data
  }

  try {
    const response = await fetch(
      `${INSTAGRAM_API_URL}/v17.0/${hashtagId}/recent_media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`
    )

    if (!response.ok) {
      const error = await response.json() as InstagramError
      throw new Error(`Instagram API Error: ${error.message}`)
    }

    const data = await response.json() as InstagramHashtagResponse
    
    // Update cache
    cache[cacheKey] = {
      data: data.data,
      timestamp: Date.now()
    }

    return data.data
  } catch (error) {
    console.error('Error fetching Instagram posts:', error)
    throw error
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hashtagId = searchParams.get('hashtagId')

    if (!hashtagId) {
      return NextResponse.json(
        { error: 'Hashtag ID is required' },
        { status: 400 }
      )
    }

    const posts = await fetchInstagramPosts(hashtagId)
    return NextResponse.json({ data: posts })
  } catch (error) {
    console.error('Instagram API route error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts' },
      { status: 500 }
    )
  }
} 