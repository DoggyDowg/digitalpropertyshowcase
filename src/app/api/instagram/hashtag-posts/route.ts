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
      return NextResponse.json({ error: 'Hashtag parameter is required' }, { status: 400 })
    }

    // Try to get posts from Supabase cache
    const { data: cachedPosts, error: cacheError } = await supabase
      .from('instagram_post_cache')
      .select('posts, cached_at')
      .eq('hashtag', hashtag)
      .single()

    // If we have recent cached posts (less than 5 minutes old), return them
    if (cachedPosts && Date.now() - new Date(cachedPosts.cached_at).getTime() < 5 * 60 * 1000) {
      return NextResponse.json(cachedPosts.posts)
    }

    // Get fresh access token
    const accessToken = await getInstagramToken()

    // Get hashtag ID
    const hashtagUrl = `https://graph.facebook.com/v18.0/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&user_id=${INSTAGRAM_BUSINESS_ACCOUNT_ID}&access_token=${accessToken}`
    const hashtagResponse = await fetch(hashtagUrl)
    
    if (!hashtagResponse.ok) {
      throw new Error(`Failed to get hashtag ID: ${hashtagResponse.statusText}`)
    }

    const hashtagData = await hashtagResponse.json()
    const hashtagId = hashtagData.data[0].id

    // Get media for hashtag
    const mediaUrl = `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?fields=id,caption,media_type,media_url,permalink,timestamp&user_id=${INSTAGRAM_BUSINESS_ACCOUNT_ID}&access_token=${accessToken}&limit=8`
    const mediaResponse = await fetch(mediaUrl)

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media: ${mediaResponse.statusText}`)
    }

    const mediaData = await mediaResponse.json()

    // Cache the results in Supabase
    const { error: upsertError } = await supabase
      .from('instagram_post_cache')
      .upsert({
        hashtag,
        posts: mediaData,
        cached_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Failed to cache posts:', upsertError)
    }

    return NextResponse.json(mediaData)
  } catch (error) {
    console.error('Instagram API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts' },
      { status: 500 }
    )
  }
} 