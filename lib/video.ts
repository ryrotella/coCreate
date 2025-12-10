// Video URL parsing utilities

export type VideoPlatform = 'youtube' | 'vimeo' | 'other'

export interface ParsedVideo {
  platform: VideoPlatform
  videoId: string
  url: string
  embedUrl: string
  thumbnailUrl: string
}

/**
 * Parse a video URL and extract platform, video ID, and embed info
 */
export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url) return null

  // YouTube patterns
  const youtubePatterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts: https://www.youtube.com/shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'youtube',
        videoId,
        url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      }
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    // Standard URL: https://vimeo.com/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    // Player URL: https://player.vimeo.com/video/VIDEO_ID
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
  ]

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        platform: 'vimeo',
        videoId,
        url,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      }
    }
  }

  return null
}

/**
 * Check if a URL is a supported video platform
 */
export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null
}

/**
 * Get the video platform from a URL
 */
export function getVideoPlatform(url: string): VideoPlatform | null {
  const parsed = parseVideoUrl(url)
  return parsed?.platform || null
}

/**
 * Generate an embed URL for a video
 */
export function getEmbedUrl(url: string): string | null {
  const parsed = parseVideoUrl(url)
  return parsed?.embedUrl || null
}

/**
 * Generate a thumbnail URL for a video
 */
export function getThumbnailUrl(url: string): string | null {
  const parsed = parseVideoUrl(url)
  return parsed?.thumbnailUrl || null
}
