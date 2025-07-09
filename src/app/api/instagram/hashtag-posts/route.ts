import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limiting
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getAccessToken() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase
    .from('instagram_settings')
    .select('access_token')
    .eq('is_active', true)
    .single()
    
  if (error || !data?.access_token) {
    throw new Error('No valid Instagram access token found')
  }
  
  return data.access_token
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hashtag = searchParams.get('hashtag')
    
    if (!hashtag) {
      return NextResponse.json({ error: 'Hashtag parameter is required' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = hashtag.toLowerCase()
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Get fresh access token
    const accessToken = await getAccessToken()
    
    // Get hashtag ID
    const hashtagResponse = await fetch(
      `https://graph.facebook.com/v18.0/ig_hashtag_search?user_id=${process.env.INSTAGRAM_USER_ID}&q=${hashtag}&access_token=${accessToken}`
    )
    
    if (!hashtagResponse.ok) {
      throw new Error(`Failed to search hashtag: ${hashtagResponse.status}`)
    }
    
    const hashtagData = await hashtagResponse.json()
    
    if (!hashtagData.data || hashtagData.data.length === 0) {
      return NextResponse.json({ posts: [] })
    }
    
    const hashtagId = hashtagData.data[0].id
    
    // Get recent media for hashtag
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?user_id=${process.env.INSTAGRAM_USER_ID}&fields=id,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${accessToken}`
    )
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch media: ${mediaResponse.status}`)
    }
    
    const mediaData = await mediaResponse.json()
    
    const posts = mediaData.data || []
    
    // Cache the results
    cache.set(cacheKey, {
      data: { posts },
      timestamp: Date.now()
    })
    
    return NextResponse.json({ posts })
    
  } catch (error) {
    console.error('Instagram API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts', posts: [] },
      { status: 500 }
    )
  }
} 