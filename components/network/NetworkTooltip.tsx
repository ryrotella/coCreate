'use client'

import { useMemo } from 'react'
import { NetworkNode } from '@/types'

interface NetworkTooltipProps {
  node: NetworkNode | null
  position: { x: number; y: number } | null
  onFollowChange?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function NetworkTooltip({ node, position, onFollowChange, onMouseEnter, onMouseLeave }: NetworkTooltipProps) {
  // Generate color based on username (matching BeaconNode and IsometricTile)
  const hue = useMemo(() => {
    if (!node) return 0
    return (node.username.charCodeAt(0) * 137 + node.username.length * 47) % 360
  }, [node])

  if (!node || !position) return null

  const displayName = node.displayName || node.username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div
      className="fixed z-[200] animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: position.x + 20,
        top: position.y - 10
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-black/90 backdrop-blur-lg rounded-lg p-3 border border-white/20 min-w-[180px] shadow-xl">
        {/* User info */}
        <div className="flex items-center gap-3 mb-3">
          {node.avatarUrl ? (
            <img
              src={node.avatarUrl}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2"
              style={{ borderColor: `hsl(${hue}, 70%, 50%)` }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
              style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{displayName}</p>
            <p className="text-white/60 text-sm">@{node.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-white/10 pt-2 space-y-1">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
            />
            <span>{node.nodeCount} item{node.nodeCount !== 1 ? 's' : ''} in space</span>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="text-purple-400/70 text-xs font-medium flex items-center justify-center gap-1">
            Click tile to enter space
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </p>
        </div>
      </div>

      {/* Pointer arrow */}
      <div
        className="absolute w-3 h-3 bg-black/90 rotate-45 -left-1.5 top-4"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
      />
    </div>
  )
}
