'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NetworkNode } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface IsometricTileProps {
  node: NetworkNode
  position: { x: number; y: number }
  isSelected: boolean
  isOnline?: boolean
  isStreaming?: boolean
  onClick: () => void
  onHover: (hovering: boolean) => void
  layerDepth: number
  tileSize?: number
  onFollowChange?: () => void
}

export default function IsometricTile({
  node,
  position,
  isSelected,
  isOnline = false,
  isStreaming = false,
  onClick,
  onHover,
  layerDepth,
  tileSize = 80,
  onFollowChange
}: IsometricTileProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isOwnTile = user?.id === node.id

  // Generate unique color based on username (matching BeaconNode logic)
  const hue = useMemo(() => (node.username.charCodeAt(0) * 137 + node.username.length * 47) % 360, [node.username])

  const colors = useMemo(() => ({
    base: `hsl(${hue}, 70%, 50%)`,
    light: `hsl(${hue}, 70%, 65%)`,
    dark: `hsl(${hue}, 70%, 35%)`,
    medium: `hsl(${hue}, 70%, 45%)`,
    glow: `hsl(${hue}, 80%, 60%)`
  }), [hue])

  // Scale based on layer depth
  const scale = Math.max(0.5, 1 - layerDepth * 0.15)

  // Get display info
  const displayName = node.displayName || node.username
  const initials = displayName.slice(0, 2).toUpperCase()

  // Check follow status when hovering
  const checkFollowStatus = async () => {
    if (!user || isOwnTile) return
    try {
      const response = await fetch(`/api/connections?userId=${user.id}&type=following`)
      if (response.ok) {
        const data = await response.json()
        const following = data.following?.some(
          (conn: { following_id: string }) => conn.following_id === node.id
        )
        setIsFollowing(following)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || followLoading) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await fetch(`/api/connections?followingId=${node.id}`, { method: 'DELETE' })
        setIsFollowing(false)
      } else {
        await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: node.id }),
        })
        setIsFollowing(true)
      }
      onFollowChange?.()
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/profile/${node.username}`)
  }

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHovered(true)
    onHover(true)
    checkFollowStatus()
  }

  const handleMouseLeave = () => {
    // Delay hiding to allow mouse to reach orbital buttons
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false)
      onHover(false)
    }, 300)
  }

  // Cancel hide when mouse enters orbital button area
  const handleOrbitalAreaEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  // Orbital positions (angle in degrees, distance from center)
  const orbitals = [
    { angle: -60, icon: 'visit', label: 'Visit Space', action: onClick },
    { angle: 0, icon: 'profile', label: 'Profile', action: handleProfile },
    { angle: 60, icon: 'follow', label: isFollowing ? 'Unfollow' : 'Follow', action: handleFollow },
  ]
  const orbitRadius = tileSize * 0.9

  return (
    <div
      className="isometric-tile group"
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${scale}) ${hovered ? 'translateY(-8px)' : ''}`,
        zIndex: hovered ? 100 : 10,
        '--tile-color': colors.base,
        '--tile-color-light': colors.light,
        '--tile-color-dark': colors.dark,
        '--tile-color-medium': colors.medium
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Isometric diamond tile container */}
      <div
        className="relative"
        style={{
          width: tileSize,
          height: tileSize,
          transform: 'rotateX(45deg) rotateZ(45deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Top face - main content area */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg overflow-hidden border-2 transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${colors.base} 0%, ${colors.light} 100%)`,
            borderColor: isSelected ? '#ffffff' : hovered ? colors.glow : 'transparent',
            boxShadow: isSelected
              ? '0 0 20px rgba(255,255,255,0.5)'
              : hovered
                ? `0 0 15px ${colors.glow}`
                : 'none',
            transform: 'translateZ(20px)'
          }}
        >
          {node.avatarUrl ? (
            <img
              src={node.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              style={{ transform: 'rotateZ(-45deg) rotateX(-45deg)' }}
            />
          ) : (
            <span
              className="text-white font-bold text-lg"
              style={{
                transform: 'rotateZ(-45deg) rotateX(-45deg)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Left face - depth */}
        <div
          className="absolute"
          style={{
            width: tileSize,
            height: 20,
            left: 0,
            bottom: -10,
            background: colors.dark,
            transform: 'rotateX(-90deg)',
            transformOrigin: 'top'
          }}
        />

        {/* Right face - depth */}
        <div
          className="absolute"
          style={{
            width: 20,
            height: tileSize,
            right: -10,
            top: 0,
            background: colors.medium,
            transform: 'rotateY(90deg)',
            transformOrigin: 'left'
          }}
        />
      </div>

      {/* Label area (counter-rotated to stay readable) */}
      <div
        className="absolute text-center pointer-events-none"
        style={{
          top: tileSize + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: tileSize * 1.5
        }}
      >
        <p
          className="text-gray-800 font-semibold text-sm truncate"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          @{node.username}
        </p>
        <p
          className="text-gray-600 text-xs"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          {node.nodeCount} item{node.nodeCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full border-2 border-white animate-pulse"
          style={{
            width: tileSize + 20,
            height: tileSize + 20,
            left: -10,
            top: -10,
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        />
      )}

      {/* Node count badge */}
      <div
        className="absolute rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{
          width: 24,
          height: 24,
          right: -8,
          top: -8,
          background: colors.dark,
          border: `2px solid ${colors.light}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {node.nodeCount > 99 ? '99+' : node.nodeCount}
      </div>

      {/* Online indicator */}
      {isOnline && !isStreaming && (
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            width: 12,
            height: 12,
            left: -4,
            top: -4,
            background: '#22c55e',
            border: '2px solid #16a34a',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
          }}
          title="Online now"
        />
      )}

      {/* LIVE streaming indicator */}
      {isStreaming && (
        <div
          className="absolute flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            left: -8,
            top: -12,
            background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
            border: '2px solid #ffffff',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
            animation: 'live-pulse 2s ease-in-out infinite'
          }}
        >
          <span
            className="w-2 h-2 rounded-full bg-white animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">
            LIVE
          </span>
        </div>
      )}

      {/* Orbital action buttons (particle style) - only show on hover */}
      {hovered && (
        <>
          <svg
            className="absolute pointer-events-none"
            style={{
              width: tileSize * 2.5,
              height: tileSize * 2.5,
              left: -tileSize * 0.75,
              top: -tileSize * 0.75,
            }}
          >
            {/* Connection lines from center to orbitals */}
            {orbitals.map((orbital, i) => {
              const rad = (orbital.angle - 90) * (Math.PI / 180)
              const endX = tileSize * 1.25 + Math.cos(rad) * orbitRadius
              const endY = tileSize * 1.25 + Math.sin(rad) * orbitRadius
              return (
                <line
                  key={`line-${i}`}
                  x1={tileSize * 1.25}
                  y1={tileSize * 1.25}
                  x2={endX}
                  y2={endY}
                  stroke={colors.glow}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.6"
                  className="animate-pulse"
                />
              )
            })}
          </svg>

          {/* Orbital buttons */}
          {orbitals.map((orbital, i) => {
        // Skip follow button if viewing own tile or not logged in
        if (orbital.icon === 'follow' && (isOwnTile || !user)) return null

        const rad = (orbital.angle - 90) * (Math.PI / 180)
        const x = Math.cos(rad) * orbitRadius
        const y = Math.sin(rad) * orbitRadius

        return (
          <button
            key={`orbital-${i}`}
            onClick={orbital.action}
            onMouseEnter={handleOrbitalAreaEnter}
            onMouseLeave={handleMouseLeave}
            disabled={orbital.icon === 'follow' && followLoading}
            className="absolute flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
            style={{
              width: 36,
              height: 36,
              left: tileSize / 2 + x - 18,
              top: tileSize / 2 + y - 18,
              background: orbital.icon === 'follow' && isFollowing
                ? `linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)`
                : orbital.icon === 'visit'
                  ? `linear-gradient(135deg, ${colors.base} 0%, ${colors.light} 100%)`
                  : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
              animation: `orbital-appear 0.3s ease-out ${i * 0.05}s both`,
            }}
            title={orbital.label}
          >
            {orbital.icon === 'visit' && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            {orbital.icon === 'profile' && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            {orbital.icon === 'follow' && (
              followLoading ? (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isFollowing ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )
            )}
          </button>
        )
      })}
        </>
      )}
    </div>
  )
}
