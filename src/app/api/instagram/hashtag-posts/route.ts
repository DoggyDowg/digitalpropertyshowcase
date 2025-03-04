import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInstagramToken } from '@/lib/instagram'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const INSTAGRAM_BUSINESS_ACCOUNT_ID = '17841439447143231'
const POSTS_CACHE_KEY = 'instagram_hashtag_posts'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hashtag = searchParams.get('hashtag')

    if (!hashtag) {
      console.error('[IG_API] Missing hashtag parameter')
      return NextResponse.json({ error: 'Hashtag parameter is required' }, { status: 400 })
    }

    console.log('[IG_API] Fetching posts for hashtag:', hashtag)

    // Try to get posts from Supabase cache
    const { data: cachedPosts, error: cacheError } = await supabase
      .from('instagram_post_cache')
      .select('posts, cached_at')
      .eq('hashtag', hashtag)
      .single()

    if (cacheError) {
      console.error('[IG_API] Supabase cache error:', cacheError)
    }

    // If we have recent cached posts (less than 5 minutes old), return them
    if (cachedPosts && Date.now() - new Date(cachedPosts.cached_at).getTime() < 5 * 60 * 1000) {
      console.log('[IG_API] Returning cached posts for hashtag:', hashtag)
      return NextResponse.json(cachedPosts.posts)
    }

    // Get fresh access token
    console.log('[IG_API] Getting fresh access token')
    const accessToken = await getInstagramToken()

    // Get hashtag ID
    console.log('[IG_API] Fetching hashtag ID for:', hashtag)
    const hashtagUrl = `https://graph.facebook.com/v18.0/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&user_id=${INSTAGRAM_BUSINESS_ACCOUNT_ID}&access_token=${accessToken}`
    const hashtagResponse = await fetch(hashtagUrl)
    
    if (!hashtagResponse.ok) {
      const errorData = await hashtagResponse.json()
      console.error('[IG_API] Failed to get hashtag ID:', errorData)
      throw new Error(`Failed to get hashtag ID: ${hashtagResponse.statusText}`)
    }

    const hashtagData = await hashtagResponse.json()
    console.log('[IG_API] Hashtag data:', hashtagData)
    const hashtagId = hashtagData.data[0].id

    // Get media for hashtag
    console.log('[IG_API] Fetching media for hashtag ID:', hashtagId)
    const mediaUrl = `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?fields=id,caption,media_type,media_url,permalink,timestamp&user_id=${INSTAGRAM_BUSINESS_ACCOUNT_ID}&access_token=${accessToken}&limit=8`
    const mediaResponse = await fetch(mediaUrl)

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.json()
      console.error('[IG_API] Failed to get media:', errorData)
      throw new Error(`Failed to get media: ${mediaResponse.statusText}`)
    }

    const mediaData = await mediaResponse.json()
    console.log('[IG_API] Received media data:', mediaData)

    // Cache the results in Supabase
    const { error: upsertError } = await supabase
      .from('instagram_post_cache')
      .upsert({
        hashtag,
        posts: mediaData,
        cached_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('[IG_API] Failed to cache posts:', upsertError)
    } else {
      console.log('[IG_API] Successfully cached posts for hashtag:', hashtag)
    }

    return NextResponse.json(mediaData)
  } catch (error) {
    console.error('[IG_API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts' },
      { status: 500 }
    )
  }
} 