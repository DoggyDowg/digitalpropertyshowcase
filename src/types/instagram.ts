export interface InstagramMedia {
  id: string
  caption: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  username: string
}

export interface InstagramHashtagResponse {
  data: InstagramMedia[]
  paging: {
    cursors: {
      before?: string
      after?: string
    }
    next?: string
  }
}

export interface InstagramError {
  message: string
  type: string
  code: number
  error_subcode?: number
  fbtrace_id: string
}

export interface InstagramConfig {
  accessToken: string
  hashtagId: string
  limit?: number
}

// Cache interface for storing Instagram data
export interface InstagramCache {
  data: InstagramMedia[]
  timestamp: number
  hashtagId: string
} 