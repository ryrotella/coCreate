'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Html } from '@react-three/drei'
import { NodeWithPlacement, TextContent, ImageContent, LinkContent, VideoContent } from '@/types'
import { useUIStore } from '@/stores/uiStore'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAuth } from '@/contexts/AuthContext'

interface NodeObjectProps {
  node: NodeWithPlacement
}

export default function NodeObject({ node }: NodeObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { user } = useAuth()
  const {
    setHoveredNode,
    isEditMode,
    isDragging,
    openNodeDetailModal,
    isEnvironmentEditMode,
    environmentEditTool,
    environmentEditTarget,
    nodeDetailModalOpen,
  } = useUIStore()
  const { updateEnvironment, saveEnvironment } = useBubbleStore()

  // Check if this is someone else's node (saved from another user)
  const isFromOtherUser = node.creator && node.creator.id !== user?.id

  // Get position from placement, or default (now handled by parent DraggableNode)
  const scale = node.placement?.scale || 1.0

  // Create unique floating pattern for each node based on its ID
  const floatOffset = node.id.charCodeAt(0) * 0.1 // Unique offset based on ID
  const floatSpeed = 0.3 + (node.id.charCodeAt(1) % 5) * 0.1 // Vary speed: 0.3-0.8
  const floatAmplitude = 0.3 + (node.id.charCodeAt(2) % 3) * 0.2 // Vary height: 0.3-0.7

  // Dynamic floating animation with rotation - disabled in edit mode to allow precise dragging
  useFrame((state) => {
    if (groupRef.current && !isEditMode && !isDragging) {
      const time = state.clock.elapsedTime

      // Vertical floating with unique pattern
      groupRef.current.position.y =
        Math.sin(time * floatSpeed + floatOffset) * floatAmplitude +
        Math.cos(time * floatSpeed * 0.5 + floatOffset) * (floatAmplitude * 0.3)

      // Gentle rotation
      groupRef.current.rotation.y += 0.005

      // Subtle side-to-side drift
      groupRef.current.position.x =
        Math.sin(time * 0.2 + floatOffset) * 0.1
      groupRef.current.position.z =
        Math.cos(time * 0.2 + floatOffset) * 0.1
    } else if (groupRef.current && isEditMode) {
      // In edit mode, reset to origin (parent handles actual position)
      groupRef.current.position.set(0, 0, 0)
      groupRef.current.rotation.y = 0
    }
  })

  // Get the node's primary color
  const getColor = () => {
    switch (node.type) {
      case 'text':
        return '#ff6b6b'
      case 'image':
        return '#4ecdc4'
      case 'link':
        return '#ffe66d'
      case 'video':
        return '#e74c3c'
      default:
        return '#95a5a6'
    }
  }

  const handleClick = () => {
    // Handle color sampling in environment edit mode
    if (isEnvironmentEditMode && environmentEditTool === 'sampler') {
      const color = getColor()
      // If a target is selected, apply the sampled color
      if (environmentEditTarget) {
        switch (environmentEditTarget) {
          case 'sky':
            updateEnvironment({ skyColor: color })
            break
          case 'ground':
            updateEnvironment({ groundColor: color })
            break
          case 'fog':
            updateEnvironment({ fogColor: color })
            break
        }
        saveEnvironment()
      }
      return
    }

    // In edit mode: clicking is handled by DraggableNode for direct drag
    // In view mode: open detail modal
    if (!isEditMode) {
      openNodeDetailModal(node.id)
    }
  }

  const handlePointerOver = () => {
    setHovered(true)
    setHoveredNode(node.id)
    // Show appropriate cursor based on mode
    if (isEnvironmentEditMode && environmentEditTool === 'sampler') {
      document.body.style.cursor = 'crosshair'
    } else if (isEditMode) {
      document.body.style.cursor = 'grab'
    } else {
      document.body.style.cursor = 'pointer'
    }
  }

  const handlePointerOut = () => {
    setHovered(false)
    setHoveredNode(null)
    document.body.style.cursor = 'default'
  }

  // Calculate text position based on node type
  const isFrameNode = node.placement?.display_style === 'frame' || node.type === 'image' || node.type === 'video'
  const textYPosition = isFrameNode ? -0.85 : -0.65 // Closer to the node

  // Parse content data
  const contentData = node.content_data as TextContent | ImageContent | LinkContent | VideoContent | null

  // Render hover detail panel (hide when modal is open)
  const renderHoverDetail = () => {
    if (!hovered || !contentData || nodeDetailModalOpen) return null

    return (
      <Html
        position={[2.5, 0, 0]}
        style={{
          pointerEvents: 'none',
          transition: 'all 0.2s',
        }}
      >
        <div className="bg-black/95 backdrop-blur-lg rounded-lg p-4 border border-white/20 shadow-2xl max-w-sm">
          <div className="text-white font-bold mb-2 text-sm">{node.title}</div>
          {node.description && (
            <div className="text-white/60 text-xs mb-3">{node.description}</div>
          )}

          {node.type === 'text' && (
            <div className="text-white/80 text-xs max-h-48 overflow-y-auto">
              {(contentData as TextContent).text}
            </div>
          )}

          {node.type === 'image' && (
            <div className="space-y-2">
              <div className="text-white/60 text-xs">
                📸 Image: {(contentData as ImageContent).url.split('/').pop()?.substring(0, 30)}...
              </div>
              {(contentData as ImageContent).alt && (
                <div className="text-white/40 text-xs">
                  Alt: {(contentData as ImageContent).alt}
                </div>
              )}
            </div>
          )}

          {node.type === 'link' && (
            <div className="space-y-1">
              <a
                href={(contentData as LinkContent).url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline break-all pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {(contentData as LinkContent).url}
              </a>
            </div>
          )}

          {node.type === 'video' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  (contentData as VideoContent).platform === 'youtube'
                    ? 'bg-red-500/30 text-red-300'
                    : 'bg-blue-500/30 text-blue-300'
                }`}>
                  {(contentData as VideoContent).platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                </span>
                <span className="text-white/40 text-xs">Video</span>
              </div>
              <div className="text-white/60 text-xs">
                Click to play video
              </div>
            </div>
          )}
        </div>
      </Html>
    )
  }

  // Render content based on type (hide Html elements when modal is open)
  const renderContent = () => {
    if (!contentData || nodeDetailModalOpen) return null

    switch (node.type) {
      case 'image':
        const imageData = contentData as ImageContent
        if (!imageData.url) return null

        return (
          <Html
            transform
            occlude
            position={[0, 0, 0.06]}
            scale={0.15}
            style={{
              width: '400px',
              height: '300px',
              pointerEvents: 'none',
            }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src={imageData.url}
                alt={imageData.alt || node.title}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </Html>
        )

      case 'text':
        const textData = contentData as TextContent
        if (!textData.text) return null

        // Show first 200 characters in 3D space
        const displayText = textData.text.length > 200
          ? textData.text.substring(0, 200) + '...'
          : textData.text

        return (
          <Billboard position={[0, 0.1, 0]}>
            <Text
              fontSize={0.08}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.5}
              textAlign="center"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {displayText}
            </Text>
          </Billboard>
        )

      case 'link':
        const linkData = contentData as LinkContent
        if (!linkData.url) return null

        return (
          <Html
            transform
            occlude
            position={[0, 0, 0.06]}
            scale={0.15}
            style={{
              width: '400px',
              pointerEvents: 'none',
            }}
          >
            <div className="bg-black/90 backdrop-blur-md rounded-lg p-4 border-2 border-white/30 shadow-2xl">
              <div className="text-white text-sm font-bold mb-1 truncate">
                {linkData.title || node.title}
              </div>
              {linkData.description && (
                <div className="text-white/60 text-xs mb-2 line-clamp-2">
                  {linkData.description}
                </div>
              )}
              <div className="text-blue-400 text-xs truncate">
                🔗 {linkData.url}
              </div>
            </div>
          </Html>
        )

      case 'video':
        const videoData = contentData as VideoContent
        if (!videoData.videoId) return null

        return (
          <Html
            transform
            occlude
            position={[0, 0, 0.06]}
            scale={0.15}
            style={{
              width: '400px',
              height: '225px',
              pointerEvents: 'none',
            }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/20 relative">
              {/* Thumbnail */}
              <img
                src={videoData.thumbnailUrl}
                alt={videoData.title || node.title}
                className="w-full h-full object-cover"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  videoData.platform === 'youtube' ? 'bg-red-600' : 'bg-blue-500'
                }`}>
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Platform badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                  videoData.platform === 'youtube' ? 'bg-red-600' : 'bg-blue-500'
                }`}>
                  {videoData.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                </span>
              </div>
            </div>
          </Html>
        )

      default:
        return null
    }
  }

  return (
    <group>
      {/* Animated group containing mesh and text together */}
      <group ref={groupRef}>
        {/* Main node mesh - background */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
          scale={scale * (hovered ? 1.1 : 1)}
        >
          {isFrameNode ? (
            <boxGeometry args={[1.8, 1.4, 0.1]} />
          ) : (
            <boxGeometry args={[1.2, 1.2, 0.1]} />
          )}
          <meshStandardMaterial
            color={getColor()}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.3 : 0.1}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>

        {/* Render actual content */}
        {renderContent()}

        {/* Hover detail panel */}
        {renderHoverDetail()}

        {/* Title text - billboarded to always face camera */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            position={[0, textYPosition, 0]}
            fontSize={0.12}
            color="white"
            anchorX="center"
            anchorY="top"
            outlineWidth={0.015}
            outlineColor="#000000"
            maxWidth={2}
          >
            {node.title}
          </Text>
        </Billboard>

        {/* Creator badge for nodes from other users (hide when modal is open) */}
        {isFromOtherUser && node.creator && !nodeDetailModalOpen && (
          <Html
            position={[0, textYPosition - 0.25, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-center gap-1 bg-purple-500/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
              <span className="opacity-70">by</span>
              <span className="font-medium">
                {node.creator.display_name || `@${node.creator.username}`}
              </span>
            </div>
          </Html>
        )}

      </group>
    </group>
  )
}
