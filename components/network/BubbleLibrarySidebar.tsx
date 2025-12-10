'use client'

import { useState } from 'react'
import { NetworkNode } from '@/types'

interface BubbleLibrarySidebarProps {
  isOpen: boolean
  onClose: () => void
  bubbles: NetworkNode[]
  onBubbleClick: (userId: string) => void
  selectedUserId: string | null
}

export default function BubbleLibrarySidebar({
  isOpen,
  onClose,
  bubbles,
  onBubbleClick,
  selectedUserId
}: BubbleLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'nodes'>('name')

  // Filter bubbles by search query
  const filteredBubbles = bubbles.filter(bubble => {
    const query = searchQuery.toLowerCase()
    return (
      bubble.username.toLowerCase().includes(query) ||
      (bubble.displayName?.toLowerCase().includes(query))
    )
  })

  // Sort bubbles
  const sortedBubbles = [...filteredBubbles].sort((a, b) => {
    if (sortBy === 'nodes') {
      return b.nodeCount - a.nodeCount
    }
    return (a.displayName || a.username).localeCompare(b.displayName || b.username)
  })

  // Generate unique color based on username (same as BubbleNode)
  const getUserColor = (username: string) => {
    const hue = (username.charCodeAt(0) * 137) % 360
    return `hsl(${hue}, 60%, 50%)`
  }

  const getInitials = (bubble: NetworkNode) => {
    const name = bubble.displayName || bubble.username
    return name.slice(0, 2).toUpperCase()
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
          <h2 className="text-white text-xl font-bold">Bubble Directory</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search bubbles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Sort Options */}
        <div className="px-4 py-2 border-b border-gray-700 flex gap-2">
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              sortBy === 'name'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortBy('nodes')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              sortBy === 'nodes'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Most Nodes
          </button>
        </div>

        {/* Bubble List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedBubbles.length === 0 ? (
            <div className="text-white/40 text-center py-8">
              <p className="text-4xl mb-2">🔍</p>
              {searchQuery ? (
                <>
                  <p>No bubbles found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <p>No bubbles yet</p>
                  <p className="text-sm mt-1">Be the first to create one!</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBubbles.map((bubble) => (
                <button
                  key={bubble.id}
                  onClick={() => {
                    onBubbleClick(bubble.id)
                    onClose()
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedUserId === bubble.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {bubble.avatarUrl ? (
                      <img
                        src={bubble.avatarUrl}
                        alt={bubble.displayName || bubble.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getUserColor(bubble.username) }}
                      >
                        {getInitials(bubble)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {bubble.displayName || bubble.username}
                      </h3>
                      <p className="text-white/60 text-sm">
                        @{bubble.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-purple-400">
                          {bubble.nodeCount} node{bubble.nodeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg
                      className="w-5 h-5 text-white/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="text-white/60 text-sm text-center">
            {bubbles.length} bubble{bubbles.length !== 1 ? 's' : ''} in the network
          </div>
        </div>
      </div>
    </>
  )
}
