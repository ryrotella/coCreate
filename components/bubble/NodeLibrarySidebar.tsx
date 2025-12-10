'use client'

import { useState } from 'react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useUIStore } from '@/stores/uiStore'
import { TextContent, ImageContent, LinkContent, VideoContent } from '@/types'

interface NodeLibrarySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function NodeLibrarySidebar({ isOpen, onClose }: NodeLibrarySidebarProps) {
  const { nodes } = useBubbleStore()
  const { selectedNodeId, openNodeDetailModal } = useUIStore()
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'link' | 'video'>('all')

  const filteredNodes = filter === 'all'
    ? nodes
    : nodes.filter(node => node.type === filter)

  const handleNodeClick = (nodeId: string) => {
    // Open the detail modal
    openNodeDetailModal(nodeId)
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
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

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-red-500/20 border-red-500'
      case 'image':
        return 'bg-teal-500/20 border-teal-500'
      case 'link':
        return 'bg-yellow-500/20 border-yellow-500'
      case 'video':
        return 'bg-rose-500/20 border-rose-500'
      default:
        return 'bg-gray-500/20 border-gray-500'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">Node Library</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All ({nodes.length})
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'text'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Text ({nodes.filter(n => n.type === 'text').length})
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'image'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Images ({nodes.filter(n => n.type === 'image').length})
            </button>
            <button
              onClick={() => setFilter('link')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'link'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Links ({nodes.filter(n => n.type === 'link').length})
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'video'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Videos ({nodes.filter(n => n.type === 'video').length})
            </button>
          </div>
        </div>

        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNodes.length === 0 ? (
            <div className="text-white/40 text-center py-8">
              <p className="text-4xl mb-2">📦</p>
              <p>No nodes yet</p>
              <p className="text-sm mt-1">Create your first node to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedNodeId === node.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : `${getNodeColor(node.type)} hover:border-opacity-100`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNodeIcon(node.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {node.title}
                      </h3>
                      {node.description && (
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">
                          {node.description}
                        </p>
                      )}
                      {!node.description && node.content_data && (
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">
                          {node.type === 'text' && (node.content_data as unknown as TextContent).text}
                          {node.type === 'image' && (node.content_data as unknown as ImageContent).alt}
                          {node.type === 'link' && ((node.content_data as unknown as LinkContent).description || (node.content_data as unknown as LinkContent).url)}
                          {node.type === 'video' && ((node.content_data as unknown as VideoContent).platform === 'youtube' ? 'YouTube' : 'Vimeo') + ' video'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/40 capitalize">
                          {node.type}
                        </span>
                        {node.placement && (
                          <span className="text-xs text-green-400">
                            ✓ Placed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="text-white/60 text-sm text-center">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} in your library
          </div>
        </div>
      </div>
    </>
  )
}
