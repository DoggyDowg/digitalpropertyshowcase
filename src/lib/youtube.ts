/**
 * Validates if a given URL is a valid YouTube URL
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
  ]

  return patterns.some(pattern => pattern.test(url))
}

/**
 * Extracts the video ID from a YouTube URL
 * Returns null if the URL is invalid
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Gets the thumbnail URL for a YouTube video
 * Returns the highest quality thumbnail available
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/**
 * Converts a YouTube URL to an embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
} 