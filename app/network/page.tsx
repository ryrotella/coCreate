'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import D3NetworkScene from '@/components/network/D3NetworkScene'
import BubbleListView from '@/components/network/BubbleListView'
import UserMenu from '@/components/auth/UserMenu'
import { useNetworkData } from '@/hooks/useNetworkData'
import { useGlobalPresence } from '@/hooks/useGlobalPresence'
import { useStream } from '@/contexts/StreamContext'
import { useAuth } from '@/contexts/AuthContext'

export default function NetworkPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { graphData, isLoading, error, refetch } = useNetworkData()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'2.5d' | 'list'>('2.5d')

  // Global presence - track who's online across the platform
  const { onlineUserIds, onlineCount, isConnected } = useGlobalPresence({
    user: user ? {
      id: user.id,
      username: user.user_metadata?.username || 'anonymous',
      displayName: user.user_metadata?.display_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    } : null,
  })

  // Get streaming users from context
  const { activeStreams } = useStream()
  const streamingUserIds = activeStreams.map(s => s.creator_id)

  const handleBubbleClick = (userId: string) => {
    setSelectedUserId(userId)
    // Navigate to the user's bubble
    router.push(`/bubble?userId=${userId}`)
  }

  const selectedUser = selectedUserId
    ? graphData.nodes.find(n => n.id === selectedUserId)
    : null

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 2.5D Isometric Network Scene (default) */}
      {viewMode === '2.5d' && (
        <D3NetworkScene
          graphData={graphData}
          onNodeClick={handleBubbleClick}
          selectedUserId={selectedUserId}
          onDeepZoom={handleBubbleClick}
          onRefresh={refetch}
          onlineUserIds={onlineUserIds}
          streamingUserIds={streamingUserIds}
        />
      )}

      {/* 3D Network Scene (legacy) - commented out for now
      {viewMode === '3d' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-white to-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-700 text-xl">Loading network...</p>
              </div>
            </div>
          }
        >
          <NetworkScene
            graphData={graphData}
            onBubbleClick={handleBubbleClick}
            selectedUserId={selectedUserId}
          />
        </Suspense>
      )}
      */}

      {/* List View */}
      {viewMode === 'list' && (
        <BubbleListView
          bubbles={graphData.nodes}
          onBubbleClick={handleBubbleClick}
        />
      )}

      {/* Header Overlay */}
      <div className={`absolute top-0 left-0 right-0 p-4 pointer-events-none ${viewMode === 'list' ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200' : ''}`}>
        <div className="flex items-start justify-between">
          {/* Logo & Title */}
          <div className="pointer-events-auto flex items-center gap-4">
            <Link
              href="/"
              className={`text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
            >
              Co-Create
            </Link>
            <div className={`rounded-lg px-4 py-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-black/50 backdrop-blur-sm'}`}>
              <h1 className={`text-lg font-bold ${viewMode === 'list' ? 'text-gray-800' : 'text-white'}`}>World</h1>
              <p className={`text-sm ${viewMode === 'list' ? 'text-gray-500' : 'text-white/60'}`}>
                {graphData.nodes.length} beacon{graphData.nodes.length !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Online count indicator */}
            <div className={`rounded-lg px-3 py-2 flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-black/30 backdrop-blur-sm'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className={`text-sm ${viewMode === 'list' ? 'text-gray-600' : 'text-white/80'}`}>
                {onlineCount} online
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Control Mode Toggle (3D view only) - commented out
            {viewMode === '3d' && (
              <button
                onClick={toggleControlMode}
                className="bg-black/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg transition-colors hover:bg-black/40 flex items-center gap-1.5"
                title={controlMode === 'editor' ? 'Switch to Fly mode' : 'Switch to Editor mode'}
              >
                {controlMode === 'editor' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Editor
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Fly
                  </>
                )}
              </button>
            )}
            */}
            {/* View Toggle */}
            <div className={`flex rounded-lg overflow-hidden ${viewMode === '2.5d' ? 'bg-black/30' : 'bg-white/90'} backdrop-blur-sm`}>
              <button
                onClick={() => setViewMode('2.5d')}
                className={`px-3 py-2 flex items-center gap-1.5 transition-colors ${
                  viewMode === '2.5d'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="2.5D Isometric View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                2.5D
              </button>
              {/* 3D button commented out
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-2 flex items-center gap-1.5 transition-colors ${
                  viewMode === '3d'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="3D View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                3D
              </button>
              */}
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
            <Link
              href="/bubble"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              My Space
            </Link>
            <div className="ml-2 pl-2 border-l border-white/20">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>


      {/* Empty State (2.5D view only) */}
      {viewMode === '2.5d' && !isLoading && graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-8 py-6 text-center max-w-md">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-white text-2xl font-bold mb-2">The world is empty</h2>
            <p className="text-white/60 mb-4">
              Be the first to plant a beacon! Sign up and start co-creating your space.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg transition-colors font-semibold pointer-events-auto"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Loading State (2.5D view only) */}
      {viewMode === '2.5d' && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 text-xl">Discovering beacons...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-red-500/20 border border-red-500/40 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Help Text (3D view only) - commented out
      {viewMode === '3d' && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 text-sm">
            {controlMode === 'editor' ? (
              <p>🗺️ <span className="text-blue-300">Editor:</span> WASD pan • Q/E altitude • Right-drag rotate • Scroll zoom • Click beacon to enter</p>
            ) : (
              <p>✈️ <span className="text-green-300">Fly:</span> WASD move relative to view • Q/E altitude • Drag to look • Scroll zoom • Shift boost</p>
            )}
          </div>
        </div>
      )}
      */}

      {/* Help Text (2.5D view) */}
      {viewMode === '2.5d' && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 text-sm">
            <p>🎮 <span className="text-purple-300">2.5D:</span> WASD/Arrows to pan • Drag to move • Scroll for layers • R to reset • Click tile to enter</p>
          </div>
        </div>
      )}

      {/* Selected User Info (3D view only) - commented out
      {viewMode === '3d' && selectedUser && (
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-purple-500/30">
            <p className="text-white font-semibold">
              {selectedUser.displayName || selectedUser.username}
            </p>
            <p className="text-white/60 text-sm">@{selectedUser.username}</p>
            <p className="text-purple-400 text-sm mt-1">Navigating to bubble...</p>
          </div>
        </div>
      )}
      */}
    </div>
  )
}
