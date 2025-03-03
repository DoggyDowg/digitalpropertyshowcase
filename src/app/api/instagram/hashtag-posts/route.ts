import { NextResponse, NextRequest } from 'next/server'
import { readCache, writeCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '17841439447143231'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hashtag = searchParams.get('hashtag')

    if (!hashtag) {
      return NextResponse.json({ error: 'Hashtag parameter is required' }, { status: 400 })
    }

    // Try to get data from cache first
    const cache = await readCache()
    const cacheKey = `hashtag-${hashtag}`
    const cachedData = cache[cacheKey]

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log('Returning cached data for hashtag:', hashtag)
      return NextResponse.json(cachedData.data)
    }

    // If not in cache or expired, fetch from Instagram API
    console.log('Fetching fresh data for hashtag:', hashtag)

    // First, get the hashtag ID
    const hashtagResponse = await fetch(
      `https://graph.facebook.com/v18.0/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
    )

    if (!hashtagResponse.ok) {
      const error = await hashtagResponse.json()
      throw new Error(error.error?.message || 'Failed to fetch hashtag ID')
    }

    const hashtagData = await hashtagResponse.json()
    const hashtagId = hashtagData.data[0]?.id

    if (!hashtagId) {
      throw new Error('Hashtag not found')
    }

    // Then, get the media for this hashtag
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?fields=id,caption,media_type,media_url,permalink,timestamp&user_id=${INSTAGRAM_BUSINESS_ACCOUNT_ID}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}&limit=8`
    )

    if (!mediaResponse.ok) {
      const error = await mediaResponse.json()
      throw new Error(error.error?.message || 'Failed to fetch hashtag media')
    }

    const mediaData = await mediaResponse.json()

    // Cache the results
    cache[cacheKey] = {
      data: mediaData.data,
      timestamp: Date.now()
    }
    await writeCache(cache)

    return NextResponse.json(mediaData.data)
  } catch (error) {
    console.error('Instagram API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 