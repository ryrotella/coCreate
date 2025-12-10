'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import BubbleScene from '@/components/bubble/BubbleScene'
import EnvironmentEditor from '@/components/bubble/EnvironmentEditor'
import EnvironmentEditToolbar from '@/components/bubble/EnvironmentEditToolbar'
import NodeCreationForm from '@/components/forms/NodeCreationForm'
import BucketCreationForm from '@/components/forms/BucketCreationForm'
import NodeLibrarySidebar from '@/components/bubble/NodeLibrarySidebar'
import NodeDetailModal from '@/components/bubble/NodeDetailModal'
import PresenceIndicators from '@/components/bubble/PresenceIndicators'
import UserMenu from '@/components/auth/UserMenu'
import FollowButton from '@/components/social/FollowButton'
import { useAuth } from '@/contexts/AuthContext'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useUIStore } from '@/stores/uiStore'
import { useBubbleData } from '@/hooks/useBubbleData'
import { usePresence } from '@/hooks/usePresence'
import { useRealtimeNodes } from '@/hooks/useRealtimeNodes'
import { BubbleChatPanel } from '@/components/chat/BubbleChatPanel'
import { ChatToggleButton } from '@/components/chat/ChatToggleButton'
import { StreamControls } from '@/components/streaming/StreamControls'
import { StreamOverlay } from '@/components/streaming/StreamOverlay'
import { NodeWithPlacement } from '@/types'

// Wrapper component to handle Suspense for useSearchParams
export default function BubblePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-full h-screen bg-gradient-to-b from-white to-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-xl">Loading bubble...</p>
        </div>
      </div>
    }>
      <BubblePageContent />
    </Suspense>
  )
}

function BubblePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const viewUserId = searchParams.get('userId')
  const { user } = useAuth()

  const { currentBubble, currentBubbleOwner, addNode, nodes, buckets } = useBubbleStore()

  // Handle zoom out to return to network
  const handleZoomOut = useCallback(() => {
    router.push('/network')
  }, [router])
  const {
    toggleEnvironmentEditor,
    isEditMode,
    setEditMode,
    isEnvironmentEditMode,
    setEnvironmentEditMode,
    nodeDetailModalOpen,
    nodeDetailModalId,
    closeNodeDetailModal,
    controlMode,
    toggleControlMode
  } = useUIStore()
  const [isNodeFormOpen, setIsNodeFormOpen] = useState(false)
  const [isBucketFormOpen, setIsBucketFormOpen] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Load bubble data on mount - pass userId if viewing another user's bubble
  const { isLoading, error } = useBubbleData(viewUserId || undefined)

  // Real-time presence - track who's viewing this space
  const { isConnected } = usePresence({
    bubbleId: currentBubble?.id || '',
    user: user ? {
      id: user.id,
      username: user.user_metadata?.username || 'anonymous',
      displayName: user.user_metadata?.display_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    } : null,
    enabled: !!currentBubble?.id,
  })

  // Real-time node updates - sync changes from other users
  useRealtimeNodes({
    bubbleWorldId: currentBubble?.id || null,
    enabled: !!currentBubble?.id,
  })

  // Check if viewing own bubble or another user's bubble
  const isOwnBubble = !viewUserId || (user && viewUserId === user.id)

  const handleNodeCreated = (node: NodeWithPlacement) => {
    // Add node to store - it already has placement from the API
    addNode(node)
  }

  // Get the node for the detail modal
  const detailNode = nodeDetailModalId
    ? nodes.find(n => n.id === nodeDetailModalId) || null
    : null

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Scene */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-white to-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 text-xl">Loading bubble world...</p>
            </div>
          </div>
        }
      >
        <BubbleScene onZoomOut={handleZoomOut} />
      </Suspense>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex items-start justify-between">
          {/* Info */}
          <div className="pointer-events-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Co-Create
            </Link>
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-white text-lg font-bold">
                    {isOwnBubble ? 'Your Space' : `${currentBubbleOwner?.display_name || currentBubbleOwner?.username}'s Space`}
                  </h1>
                  <p className="text-white/60 text-sm">
                    {!isOwnBubble && currentBubbleOwner?.username ? (
                      <Link href={`/profile/${currentBubbleOwner.username}`} className="hover:text-purple-400 transition-colors">
                        @{currentBubbleOwner.username}
                      </Link>
                    ) : (
                      <>@{currentBubbleOwner?.username || 'you'}</>
                    )}
                    {' '}• {nodes.length} node{nodes.length !== 1 ? 's' : ''}
                    {buckets.length > 0 && <> • {buckets.length} bucket{buckets.length !== 1 ? 's' : ''}</>}
                    {!isOwnBubble && <span className="text-purple-400 ml-2">• Visiting</span>}
                  </p>
                </div>
                {/* Follow button when visiting another user's space */}
                {!isOwnBubble && viewUserId && (
                  <FollowButton
                    targetUserId={viewUserId}
                    targetUsername={currentBubbleOwner?.username}
                    variant="compact"
                  />
                )}
              </div>
              {isLoading && (
                <p className="text-white/40 text-xs mt-1">Loading nodes...</p>
              )}
              {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
              )}
            </div>
            {/* Live presence indicator */}
            <PresenceIndicators isConnected={isConnected} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Control Mode Toggle */}
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
            <Link
              href="/network"
              className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              World
            </Link>
            {/* Only show edit controls when viewing own bubble */}
            {isOwnBubble && (
              <>
                {/* Stream Controls */}
                <StreamControls />
                <button
                  onClick={() => setEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
                    isEditMode
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-100 text-black'
                  }`}
                >
                  {isEditMode ? '✓ Edit Mode' : '✏️ Edit'}
                </button>
                <button
                  onClick={() => setIsNodeFormOpen(true)}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  ➕ Add Node
                </button>
                <button
                  onClick={() => setIsBucketFormOpen(true)}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  📁 New Bucket
                </button>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  📚 Library
                </button>
                <button
                  onClick={() => setEnvironmentEditMode(!isEnvironmentEditMode)}
                  className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
                    isEnvironmentEditMode
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-100 text-black'
                  }`}
                >
                  🎨 Environment
                </button>
              </>
            )}
            {/* Show profile and "My Space" buttons when viewing another user's space */}
            {!isOwnBubble && currentBubbleOwner?.username && (
              <Link
                href={`/profile/${currentBubbleOwner.username}`}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title={`View ${currentBubbleOwner.display_name || currentBubbleOwner.username}'s profile`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
            )}
            {!isOwnBubble && user && (
              <Link
                href="/bubble"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                My Space
              </Link>
            )}
            <div className="ml-2 pl-2 border-l border-white/20">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State - Arrow pointing to Add Node (only show for own space) */}
      {!isLoading && nodes.length === 0 && isOwnBubble && (
        <div className="absolute top-24 right-4 pointer-events-none flex flex-col items-end">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-4 text-center max-w-xs mr-8">
            <p className="text-white text-lg font-semibold mb-1">Your space is empty!</p>
            <p className="text-white/60 text-sm">Create your first node to start co-creating</p>
          </div>
          {/* Animated arrow pointing up-right to Add Node button */}
          <div className="mr-32 -mt-2">
            <svg
              className="w-16 h-16 text-white animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: 'rotate(-45deg)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Empty State for viewing another user's empty space */}
      {!isLoading && nodes.length === 0 && !isOwnBubble && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-8 py-6 text-center max-w-md">
            <p className="text-white text-xl font-semibold mb-2">This space is empty</p>
            <p className="text-white/60">
              {currentBubbleOwner?.display_name || currentBubbleOwner?.username} hasn&apos;t added any content yet.
            </p>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 text-sm">
          {isEditMode ? (
            <p>✏️ <span className="text-blue-400">Edit Mode:</span> Drag to move • R/F or scroll to adjust height • Click outside to deselect</p>
          ) : controlMode === 'editor' ? (
            <p>🗺️ <span className="text-blue-300">Editor:</span> WASD pan • Q/E altitude • Right-drag rotate • Scroll zoom out to world</p>
          ) : (
            <p>✈️ <span className="text-green-300">Fly:</span> WASD move relative to view • Q/E altitude • Drag to look • Shift boost</p>
          )}
        </div>
      </div>

      {/* Environment Editor Panel (Advanced mode) */}
      <EnvironmentEditor />

      {/* Environment Edit Mode Toolbar */}
      <EnvironmentEditToolbar />

      {/* Node Creation Form */}
      <NodeCreationForm
        isOpen={isNodeFormOpen}
        onClose={() => setIsNodeFormOpen(false)}
        onNodeCreated={handleNodeCreated}
      />

      {/* Bucket Creation Form */}
      <BucketCreationForm
        isOpen={isBucketFormOpen}
        onClose={() => setIsBucketFormOpen(false)}
      />

      {/* Node Library Sidebar */}
      <NodeLibrarySidebar
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Node Detail Modal */}
      <NodeDetailModal
        node={detailNode}
        isOpen={nodeDetailModalOpen}
        onClose={closeNodeDetailModal}
      />

      {/* Chat Panel */}
      {currentBubble && (
        <>
          <BubbleChatPanel
            bubbleId={currentBubble.id}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
          {!isChatOpen && (
            <ChatToggleButton
              onClick={() => setIsChatOpen(true)}
              isOpen={isChatOpen}
            />
          )}
        </>
      )}

      {/* Stream Overlay - Shows active streams */}
      <StreamOverlay viewingUserId={viewUserId || undefined} />
    </div>
  )
}
