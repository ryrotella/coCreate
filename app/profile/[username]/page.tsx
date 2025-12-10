'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/auth/UserMenu'
import FollowButton from '@/components/social/FollowButton'
import FollowersModal from '@/components/social/FollowersModal'

interface UserProfile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  nodeCount: number
  followerCount: number
  followingCount: number
}

interface UserNode {
  id: string
  title: string
  description: string | null
  type: string
  content_type: string | null
  content_data: { url?: string; text?: string } | null
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nodes, setNodes] = useState<UserNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followersModalOpen, setFollowersModalOpen] = useState(false)
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers')

  const isOwnProfile = user && profile && user.id === profile.id

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/users/${username}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found')
          } else {
            setError('Failed to load profile')
          }
          return
        }

        const data = await response.json()
        setProfile(data)

        // Fetch user's nodes
        const nodesResponse = await fetch(`/api/nodes?userId=${data.id}`)
        if (nodesResponse.ok) {
          const nodesData = await nodesResponse.json()
          setNodes(nodesData.nodes || [])
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  // Refetch profile after follow change
  const handleFollowChange = async () => {
    if (!profile) return
    try {
      const response = await fetch(`/api/users/${username}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (err) {
      console.error('Error refetching profile:', err)
    }
  }

  // Open followers/following modal
  const openFollowersModal = (tab: 'followers' | 'following') => {
    setFollowersModalTab(tab)
    setFollowersModalOpen(true)
  }

  // Generate color from username
  const hue = profile
    ? (profile.username.charCodeAt(0) * 137 + profile.username.length * 47) % 360
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-white mb-2">{error || 'User not found'}</h1>
          <p className="text-white/60 mb-6">The user @{username} doesn&apos;t exist.</p>
          <Link
            href="/network"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Explore World
          </Link>
        </div>
      </div>
    )
  }

  const displayName = profile.displayName || profile.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Co-Create
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/network"
              className="text-white/60 hover:text-white transition-colors"
            >
              World
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full border-4"
                style={{ borderColor: `hsl(${hue}, 70%, 50%)` }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
              >
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                {!isOwnProfile && (
                  <FollowButton
                    targetUserId={profile.id}
                    targetUsername={profile.username}
                    onFollowChange={handleFollowChange}
                  />
                )}
                {isOwnProfile && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-white/60 mb-3">@{profile.username}</p>
              {profile.bio && (
                <p className="text-white/80 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 text-sm">
                <button
                  onClick={() => openFollowersModal('followers')}
                  className="hover:text-purple-400 transition-colors"
                >
                  <span className="font-bold text-white">{profile.followerCount}</span>
                  <span className="text-white/60 ml-1">followers</span>
                </button>
                <button
                  onClick={() => openFollowersModal('following')}
                  className="hover:text-purple-400 transition-colors"
                >
                  <span className="font-bold text-white">{profile.followingCount}</span>
                  <span className="text-white/60 ml-1">following</span>
                </button>
                <div>
                  <span className="font-bold text-white">{profile.nodeCount}</span>
                  <span className="text-white/60 ml-1">nodes</span>
                </div>
              </div>

              {/* Meta */}
              <p className="text-white/40 text-sm mt-4">
                Joined {joinDate}
              </p>
            </div>

            {/* Visit Space Button */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/bubble?userId=${profile.id}`}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg transition-colors font-semibold text-center"
              >
                Visit Space
              </Link>
              {isOwnProfile && (
                <Link
                  href="/bubble"
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors text-center text-sm"
                >
                  Edit Space
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {isOwnProfile ? 'Your Nodes' : `${displayName}'s Nodes`}
          </h2>

          {nodes.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-white/60">
                {isOwnProfile
                  ? "You haven't created any nodes yet."
                  : `${displayName} hasn't created any nodes yet.`}
              </p>
              {isOwnProfile && (
                <Link
                  href="/bubble"
                  className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Your First Node
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                >
                  {/* Node Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        node.type === 'image'
                          ? 'bg-blue-500/20 text-blue-400'
                          : node.type === 'link'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {node.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {node.title}
                  </h3>

                  {/* Description */}
                  {node.description && (
                    <p className="text-white/60 text-sm line-clamp-2 mb-2">
                      {node.description}
                    </p>
                  )}

                  {/* Preview */}
                  {node.type === 'image' && node.content_data?.url && (
                    <div className="mt-2 rounded-lg overflow-hidden bg-black/20">
                      <img
                        src={node.content_data.url}
                        alt={node.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  {node.type === 'text' && node.content_data?.text && (
                    <p className="text-white/50 text-xs mt-2 line-clamp-3 italic">
                      &ldquo;{node.content_data.text}&rdquo;
                    </p>
                  )}

                  {node.type === 'link' && node.content_data?.url && (
                    <p className="text-purple-400 text-xs mt-2 truncate">
                      {node.content_data.url}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        userId={profile.id}
        username={profile.username}
        initialTab={followersModalTab}
      />
    </div>
  )
}
