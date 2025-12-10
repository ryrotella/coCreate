'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FollowButton from './FollowButton'

interface FollowerUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Connection {
  id: string
  follower_id: string
  following_id: string
  connection_type: string
  created_at: string
  follower?: FollowerUser
  following?: FollowerUser
}

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
  initialTab?: 'followers' | 'following'
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  username,
  initialTab = 'followers',
}: FollowersModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
  const [followers, setFollowers] = useState<Connection[]>([])
  const [following, setFollowing] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Reset tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Fetch connections when modal opens
  useEffect(() => {
    if (!isOpen) return

    async function fetchConnections() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/connections?userId=${userId}&type=all`)
        if (response.ok) {
          const data = await response.json()
          setFollowers(data.followers || [])
          setFollowing(data.following || [])
        }
      } catch (error) {
        console.error('Error fetching connections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConnections()
  }, [isOpen, userId])

  // Handle navigation to profile
  const goToProfile = (targetUsername: string) => {
    onClose()
    router.push(`/profile/${targetUsername}`)
  }

  // Handle navigation to space
  const goToSpace = (targetUserId: string) => {
    onClose()
    router.push(`/bubble?userId=${targetUserId}`)
  }

  if (!isOpen) return null

  const currentList = activeTab === 'followers' ? followers : following

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">@{username}</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Followers ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'following'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Following ({following.length})
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">
                {activeTab === 'followers' ? '👥' : '🔍'}
              </div>
              <p className="text-white/60">
                {activeTab === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((connection) => {
                // For followers, show the follower user
                // For following, show the following user
                const user =
                  activeTab === 'followers'
                    ? connection.follower
                    : connection.following

                if (!user) return null

                const displayName = user.display_name || user.username
                const hue = (user.username.charCodeAt(0) * 137 + user.username.length * 47) % 360
                const initials = displayName.slice(0, 2).toUpperCase()

                return (
                  <div
                    key={connection.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {/* Avatar */}
                    <button
                      onClick={() => goToProfile(user.username)}
                      className="shrink-0"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="w-12 h-12 rounded-full border-2"
                          style={{ borderColor: `hsl(${hue}, 70%, 50%)` }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                        >
                          {initials}
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => goToProfile(user.username)}
                        className="block text-left"
                      >
                        <p className="font-semibold text-white truncate hover:text-purple-400 transition-colors">
                          {displayName}
                        </p>
                        <p className="text-white/60 text-sm truncate">
                          @{user.username}
                        </p>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <FollowButton
                        targetUserId={user.id}
                        targetUsername={user.username}
                        variant="compact"
                      />
                      <button
                        onClick={() => goToSpace(user.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                        title="Visit space"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
