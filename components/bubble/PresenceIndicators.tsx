'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePresenceStore, PresenceUser } from '@/stores/presenceStore'

interface PresenceIndicatorsProps {
  isConnected: boolean
}

export default function PresenceIndicators({ isConnected }: PresenceIndicatorsProps) {
  const { viewers } = usePresenceStore()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isConnected || viewers.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span className="text-white/60 text-xs">
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main indicator button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-black/40 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-white text-sm font-medium">
          {viewers.length} viewing
        </span>
        {/* Stacked avatars preview */}
        <div className="flex -space-x-2">
          {viewers.slice(0, 3).map((viewer, index) => (
            <ViewerAvatar key={viewer.id} viewer={viewer} size="sm" index={index} />
          ))}
          {viewers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-black/50 flex items-center justify-center">
              <span className="text-white text-xs">+{viewers.length - 3}</span>
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded viewer list dropdown */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-white/10 z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">
              Viewers ({viewers.length})
            </h3>
            <p className="text-white/40 text-xs">People viewing this space</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {viewers.map((viewer) => (
              <ViewerListItem key={viewer.id} viewer={viewer} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Avatar component
function ViewerAvatar({ viewer, size = 'md', index = 0 }: { viewer: PresenceUser; size?: 'sm' | 'md'; index?: number }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'

  // Generate a consistent color based on username
  const hue = viewer.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
  const bgColor = `hsl(${hue}, 70%, 50%)`

  if (viewer.avatarUrl) {
    return (
      <img
        src={viewer.avatarUrl}
        alt={viewer.username}
        className={`${sizeClass} rounded-full border-2 border-black/50 object-cover`}
        style={{ zIndex: 10 - index }}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full border-2 border-black/50 flex items-center justify-center font-semibold text-white`}
      style={{ backgroundColor: bgColor, zIndex: 10 - index }}
    >
      {viewer.username.charAt(0).toUpperCase()}
    </div>
  )
}

// List item component
function ViewerListItem({ viewer }: { viewer: PresenceUser }) {
  return (
    <Link
      href={`/profile/${viewer.username}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
    >
      <ViewerAvatar viewer={viewer} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {viewer.displayName || viewer.username}
        </p>
        <p className="text-white/40 text-xs truncate">@{viewer.username}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-white/40 text-xs">now</span>
      </div>
    </Link>
  )
}
