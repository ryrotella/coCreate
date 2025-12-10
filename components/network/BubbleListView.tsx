'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NetworkNode } from '@/types'
import FollowButton from '@/components/social/FollowButton'

interface BubbleListViewProps {
  bubbles: NetworkNode[]
  onBubbleClick: (userId: string) => void
}

export default function BubbleListView({ bubbles, onBubbleClick }: BubbleListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'nodes' | 'recent'>('name')

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
    // Default: alphabetical by name
    return (a.displayName || a.username).localeCompare(b.displayName || b.username)
  })

  // Generate unique color based on username
  const getUserColor = (username: string) => {
    const hue = (username.charCodeAt(0) * 137) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  const getInitials = (bubble: NetworkNode) => {
    const name = bubble.displayName || bubble.username
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-white to-gray-100 overflow-hidden flex flex-col">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search bubbles by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              A-Z
            </button>
            <button
              onClick={() => setSortBy('nodes')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === 'nodes'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Most Content
            </button>
          </div>
        </div>
      </div>

      {/* Bubble Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {sortedBubbles.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              {searchQuery ? (
                <>
                  <p className="text-gray-600 text-xl">No bubbles found</p>
                  <p className="text-gray-400 mt-2">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-xl">No bubbles yet</p>
                  <p className="text-gray-400 mt-2">Be the first to create one!</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBubbles.map((bubble) => (
                <div
                  key={bubble.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Large Avatar */}
                    {bubble.avatarUrl ? (
                      <img
                        src={bubble.avatarUrl}
                        alt={bubble.displayName || bubble.username}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-purple-100 transition-all"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ring-4 ring-gray-100 group-hover:ring-purple-100 transition-all"
                        style={{ backgroundColor: getUserColor(bubble.username) }}
                      >
                        {getInitials(bubble)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-lg truncate group-hover:text-purple-600 transition-colors">
                        {bubble.displayName || bubble.username}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        @{bubble.username}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" />
                          </svg>
                          {bubble.nodeCount} node{bubble.nodeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => onBubbleClick(bubble.id)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Visit Space
                    </button>
                    <Link
                      href={`/profile/${bubble.username}`}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="View profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <FollowButton
                      targetUserId={bubble.id}
                      targetUsername={bubble.username}
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="text-center text-gray-500 text-sm">
          {bubbles.length} bubble{bubbles.length !== 1 ? 's' : ''} in the network
        </div>
      </div>
    </div>
  )
}
