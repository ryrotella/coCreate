'use client'

import { useState, useEffect } from 'react'
import { NodeWithPlacement } from '@/types'
import { parseVideoUrl, ParsedVideo } from '@/lib/video'

interface NodeCreationFormProps {
  isOpen: boolean
  onClose: () => void
  onNodeCreated: (node: NodeWithPlacement) => void
}

type NodeType = 'text' | 'image' | 'link' | 'video'

export default function NodeCreationForm({
  isOpen,
  onClose,
  onNodeCreated,
}: NodeCreationFormProps) {
  const [type, setType] = useState<NodeType>('text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [textContent, setTextContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [parsedVideo, setParsedVideo] = useState<ParsedVideo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse video URL when it changes
  useEffect(() => {
    if (type === 'video' && videoUrl) {
      const parsed = parseVideoUrl(videoUrl)
      setParsedVideo(parsed)
    } else {
      setParsedVideo(null)
    }
  }, [videoUrl, type])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare content data based on type
      let content_data = {}
      if (type === 'text') {
        content_data = { text: textContent }
      } else if (type === 'image') {
        content_data = { url: imageUrl, alt: title }
      } else if (type === 'link') {
        content_data = { url: linkUrl, title, description }
      } else if (type === 'video') {
        if (!parsedVideo) {
          throw new Error('Invalid video URL. Please use a YouTube or Vimeo link.')
        }
        content_data = {
          url: videoUrl,
          platform: parsedVideo.platform,
          videoId: parsedVideo.videoId,
          thumbnailUrl: parsedVideo.thumbnailUrl,
          title,
        }
      }

      // Create the node
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          content_type: type,
          content_data,
          tags: [],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create node')
      }

      const { node } = await response.json()

      // Reset form
      setTitle('')
      setDescription('')
      setTextContent('')
      setImageUrl('')
      setLinkUrl('')
      setVideoUrl('')
      setParsedVideo(null)

      // Notify parent
      onNodeCreated(node)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 backdrop-blur-md rounded-lg p-6 w-full max-w-lg border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Node</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['text', 'image', 'link', 'video'] as NodeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded transition-colors text-sm ${
                    type === t
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {t === 'text' && '📝'}
                  {t === 'image' && '🖼️'}
                  {t === 'link' && '🔗'}
                  {t === 'video' && '🎬'}
                  {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              placeholder="Give your node a title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Type-specific fields */}
          {type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Text Content *
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                placeholder="Enter your text here..."
              />
            </div>
          )}

          {type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Image URL *
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-white/40 mt-1">
                Paste a direct link to an image (jpg, png, gif)
              </p>
            </div>
          )}

          {type === 'link' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="https://example.com"
              />
            </div>
          )}

          {type === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Video URL *
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <p className="text-xs text-white/40 mt-1">
                  Supports YouTube and Vimeo links
                </p>
              </div>

              {/* Video Preview */}
              {parsedVideo && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      parsedVideo.platform === 'youtube'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {parsedVideo.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                    </span>
                    <span className="text-white/40 text-xs">Video detected</span>
                  </div>
                  <div className="relative aspect-video rounded overflow-hidden bg-black/50">
                    <img
                      src={parsedVideo.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {videoUrl && !parsedVideo && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    Could not detect video. Please use a valid YouTube or Vimeo URL.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-gray-200 py-3 rounded transition-colors text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
