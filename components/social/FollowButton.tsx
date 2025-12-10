'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ConnectionType } from '@/types'

interface FollowButtonProps {
  targetUserId: string
  targetUsername?: string
  variant?: 'default' | 'compact' | 'icon'
  connectionType?: ConnectionType
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  variant = 'default',
  connectionType = 'follow',
  onFollowChange,
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.id === targetUserId) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/connections?userId=${user.id}&type=following`)
        if (response.ok) {
          const data = await response.json()
          const isAlreadyFollowing = data.following?.some(
            (conn: { following_id: string }) => conn.following_id === targetUserId
          )
          setIsFollowing(isAlreadyFollowing)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkFollowStatus()
  }, [user, targetUserId])

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!user || isLoading) return

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/connections?followingId=${targetUserId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsFollowing(false)
          onFollowChange?.(false)
        }
      } else {
        // Follow
        const response = await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followingId: targetUserId,
            connectionType,
          }),
        })
        if (response.ok) {
          setIsFollowing(true)
          onFollowChange?.(true)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if not logged in or viewing own profile
  if (!user || user.id === targetUserId) {
    return null
  }

  // Icon variant (for compact spaces)
  if (variant === 'icon') {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`p-1.5 rounded-full transition-all duration-200 disabled:opacity-50 ${
          isFollowing
            ? isHovered
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-purple-500/20 text-purple-400'
            : 'bg-white/10 text-white/80 hover:bg-purple-500/30 hover:text-purple-400'
        } ${className}`}
        title={isFollowing ? 'Unfollow' : `Follow ${targetUsername || 'user'}`}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isFollowing ? (
          isHovered ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 disabled:opacity-50 ${
          isFollowing
            ? isHovered
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
            : 'bg-white/10 text-white border border-white/20 hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/40'
        } ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        ) : isFollowing ? (
          isHovered ? 'Unfollow' : 'Following'
        ) : (
          'Follow'
        )}
      </button>
    )
  }

  // Default variant
  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 ${
        isFollowing
          ? isHovered
            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
            : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
          : 'bg-purple-600 text-white hover:bg-purple-700 border border-purple-500'
      } ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : isFollowing ? (
        <span className="flex items-center gap-2">
          {isHovered ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Unfollow
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Following
            </>
          )}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Follow
        </span>
      )}
    </button>
  )
}
