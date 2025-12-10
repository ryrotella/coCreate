'use client'

import { useState } from 'react'
import { NodeWithPlacement, TextContent, ImageContent, LinkContent, VideoContent } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useBubbleStore } from '@/stores/bubbleStore'
import NodeConnections from './NodeConnections'

interface NodeDetailModalProps {
  node: NodeWithPlacement | null
  isOpen: boolean
  onClose: () => void
  onNodeSaved?: () => void
}

export default function NodeDetailModal({ node, isOpen, onClose, onNodeSaved }: NodeDetailModalProps) {
  const { user } = useAuth()
  const { addNode, currentBubbleOwner } = useBubbleStore()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  if (!isOpen || !node) return null

  // Check if viewing own bubble (only then can we add nodes to it)
  const isViewingOwnBubble = user?.id === currentBubbleOwner?.id
  const isOwnNode = user?.id === node.creator_id

  const handleSaveNode = async (placeInWorld: boolean) => {
    if (!user || isOwnNode) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch('/api/saved-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          placeInWorld,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save node')
      }

      const data = await response.json()

      // If placed in world and we're viewing our own bubble, add to store immediately
      if (placeInWorld && data.placement && isViewingOwnBubble) {
        const nodeWithPlacement: NodeWithPlacement = {
          ...node,
          placement: data.placement,
        }
        addNode(nodeWithPlacement)
      }

      setIsSaved(true)
      if (onNodeSaved) {
        onNodeSaved()
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save node')
    } finally {
      setIsSaving(false)
    }
  }

  const contentData = node.content_data as TextContent | ImageContent | LinkContent | VideoContent | null

  const renderContent = () => {
    if (!contentData) {
      return (
        <div className="text-white/60 text-sm">
          No content available for this node.
        </div>
      )
    }

    switch (node.type) {
      case 'text':
        const textData = contentData as TextContent
        return (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-white whitespace-pre-wrap leading-relaxed">
                {textData.text}
              </p>
            </div>
          </div>
        )

      case 'image':
        const imageData = contentData as ImageContent
        return (
          <div className="space-y-4">
            <div className="bg-black/50 rounded-lg overflow-hidden">
              <img
                src={imageData.url}
                alt={imageData.alt || node.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            {imageData.alt && (
              <div className="text-white/60 text-sm">
                <span className="font-semibold">Alt text:</span> {imageData.alt}
              </div>
            )}
            <div className="text-white/40 text-xs break-all">
              <span className="font-semibold">URL:</span> {imageData.url}
            </div>
          </div>
        )

      case 'link':
        const linkData = contentData as LinkContent
        return (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-6">
              <a
                href={linkData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg font-semibold underline break-all block mb-4"
              >
                {linkData.url}
              </a>
              {linkData.description && (
                <p className="text-white/80 leading-relaxed">
                  {linkData.description}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <a
                href={linkData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors text-center font-semibold"
              >
                Open Link →
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkData.url)
                }}
                className="bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
              >
                Copy URL
              </button>
            </div>
          </div>
        )

      case 'video':
        const videoData = contentData as VideoContent
        const getEmbedUrl = () => {
          if (videoData.platform === 'youtube') {
            return `https://www.youtube.com/embed/${videoData.videoId}?autoplay=1&rel=0`
          } else if (videoData.platform === 'vimeo') {
            return `https://player.vimeo.com/video/${videoData.videoId}?autoplay=1`
          }
          return null
        }
        const embedUrl = getEmbedUrl()

        return (
          <div className="space-y-4">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={videoData.title || node.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <p className="text-white/60">Unable to load video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                videoData.platform === 'youtube'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {videoData.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
              </span>
              <span className="text-white/40 text-sm">Video ID: {videoData.videoId}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={videoData.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-3 px-4 rounded-lg transition-colors text-center font-semibold text-white ${
                  videoData.platform === 'youtube'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Watch on {videoData.platform === 'youtube' ? 'YouTube' : 'Vimeo'} →
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(videoData.url)}
                className="bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
              >
                Copy URL
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getTypeIcon = () => {
    switch (node.type) {
      case 'text':
        return '📝'
      case 'image':
        return '🖼️'
      case 'link':
        return '🔗'
      case 'video':
        return '🎬'
      default:
        return '📄'
    }
  }

  const getTypeName = () => {
    return node.type.charAt(0).toUpperCase() + node.type.slice(1)
  }

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getTypeIcon()}</span>
              <span className="text-white/60 text-sm font-semibold uppercase tracking-wide">
                {getTypeName()} Node
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {node.title}
            </h2>
            {node.description && (
              <p className="text-white/60 text-sm">
                {node.description}
              </p>
            )}
            {/* Creator attribution - show when viewing someone else's node */}
            {node.creator && node.creator.id !== user?.id && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-white/40 text-sm">Created by</span>
                <a
                  href={`/profile/${node.creator.username}`}
                  className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-2 py-1 -ml-2 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {node.creator.avatar_url ? (
                    <img
                      src={node.creator.avatar_url}
                      alt={node.creator.display_name || node.creator.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {(node.creator.display_name || node.creator.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-purple-400 font-medium text-sm hover:text-purple-300">
                    {node.creator.display_name || `@${node.creator.username}`}
                  </span>
                </a>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-3xl leading-none transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderContent()}

          {/* Connections section - Are.na style */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <NodeConnections nodeId={node.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-white/40 text-xs">
            Created {new Date(node.created_at).toLocaleDateString()}
            {node.created_at !== node.updated_at && (
              <> • Updated {new Date(node.updated_at).toLocaleDateString()}</>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Save buttons - only show for other users' nodes */}
            {user && !isOwnNode && !isSaved && (
              <>
                {saveError && (
                  <span className="text-red-400 text-xs mr-2">{saveError}</span>
                )}
                <button
                  onClick={() => handleSaveNode(false)}
                  disabled={isSaving}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save to Collection'}
                </button>
                <button
                  onClick={() => handleSaveNode(true)}
                  disabled={isSaving}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save & Place in My World'}
                </button>
              </>
            )}
            {isSaved && (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved to your collection!
              </span>
            )}
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white py-2 px-6 rounded-lg transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
