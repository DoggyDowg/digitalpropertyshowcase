import { NextResponse } from 'next/server'
import type { InstagramMedia, InstagramHashtagResponse, InstagramError } from '@/types/instagram'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const INSTAGRAM_API_URL = 'https://graph.instagram.com'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const REQUEST_TIMEOUT = 10000 // 10 seconds timeout

// In-memory cache (consider using Redis or similar for production)
const cache: Record<string, { data: InstagramMedia[]; timestamp: number }> = {}

// Add timeout wrapper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

async function fetchInstagramPosts(hashtagId: string): Promise<InstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('Instagram access token not configured')
  }

  // Check cache first
  const cacheKey = `hashtag_${hashtagId}`
  const cachedData = cache[cacheKey]
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log('Returning cached Instagram data for hashtag:', hashtagId);
    return cachedData.data
  }

  try {
    console.log('Fetching fresh Instagram data for hashtag:', hashtagId);
    
    const response = await withTimeout(
      fetch(
        `${INSTAGRAM_API_URL}/v17.0/${hashtagId}/recent_media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`,
        {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        }
      ),
      REQUEST_TIMEOUT
    );

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

    console.log(`Successfully fetched ${data.data.length} Instagram posts`);
    return data.data
  } catch (error) {
    console.error('Error fetching Instagram posts:', error)
    
    // Return cached data if available, even if expired
    if (cachedData) {
      console.log('Returning expired cached data due to error');
      return cachedData.data;
    }
    
    throw error
  }
}

export async function GET(request: Request) {
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
    
    return NextResponse.json(
      { data: posts },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minute cache
        }
      }
    )
  } catch (error) {
    console.error('Instagram API route error:', error)
    
    // Return specific error for timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Instagram API timeout', message: 'Request took too long to complete' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts' },
      { status: 500 }
    )
  }
} 