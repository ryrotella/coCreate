'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { NetworkGraphData, NetworkLayerData, LayerConfig } from '@/types'
import IsometricGrid from './IsometricGrid'
import ConnectionLayer from './ConnectionLayer'
import ZAxisController from './ZAxisController'
import NetworkTooltip from './NetworkTooltip'

interface D3NetworkSceneProps {
  graphData: NetworkGraphData
  onNodeClick: (userId: string) => void
  selectedUserId: string | null
  onDeepZoom?: (userId: string) => void
  onRefresh?: () => void
  onlineUserIds?: string[]
  streamingUserIds?: string[]
}

interface PanOffset {
  x: number
  y: number
}

// Default layer configuration
const DEFAULT_LAYER_CONFIG: LayerConfig = {
  maxNodesPerLayer: 20,
  layerSpacing: 200,
  scaleFactor: 0.85,
  opacityFactor: 0.7
}

export default function D3NetworkScene({
  graphData,
  onNodeClick,
  selectedUserId,
  onDeepZoom,
  onRefresh,
  onlineUserIds = [],
  streamingUserIds = []
}: D3NetworkSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Start with placeholder dimensions - will be updated on mount
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [currentLayer, setCurrentLayer] = useState(0)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [isTooltipHovered, setIsTooltipHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Pan state for moving around the network
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const keysPressed = useRef<Set<string>>(new Set())

  // Mark as mounted on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Measure container dimensions after mount
  useEffect(() => {
    if (!isMounted) return

    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
      }
    }

    // Measure immediately
    updateDimensions()

    // Also measure after a short delay to catch late layout
    const timeoutId = setTimeout(updateDimensions, 100)

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(container)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [isMounted])

  // Distribute nodes into layers based on overflow
  const layers = useMemo((): NetworkLayerData[] => {
    const { nodes } = graphData
    const { maxNodesPerLayer } = DEFAULT_LAYER_CONFIG

    if (nodes.length === 0) return []

    // Sort by node count (more content = more prominent = earlier layer)
    const sortedNodes = [...nodes].sort((a, b) => b.nodeCount - a.nodeCount)

    const result: NetworkLayerData[] = []
    for (let i = 0; i < sortedNodes.length; i += maxNodesPerLayer) {
      const layerNodes = sortedNodes.slice(i, i + maxNodesPerLayer)
      result.push({
        layerIndex: Math.floor(i / maxNodesPerLayer),
        nodes: layerNodes,
        isActive: Math.floor(i / maxNodesPerLayer) === currentLayer
      })
    }

    return result
  }, [graphData.nodes, currentLayer])

  // Build node positions map for connections
  const nodePositions = useMemo(() => {
    const map = new Map<string, { id: string; x: number; y: number; layer: number }>()

    // This is a simplified position estimation
    // Real positions come from the IsometricGrid force simulation
    layers.forEach((layer) => {
      layer.nodes.forEach((node, index) => {
        const angle = (index / layer.nodes.length) * 2 * Math.PI
        const radius = Math.min(dimensions.width, dimensions.height) * 0.3
        map.set(node.id, {
          id: node.id,
          x: dimensions.width / 2 + Math.cos(angle) * radius,
          y: dimensions.height / 2 + Math.sin(angle) * radius,
          layer: layer.layerIndex
        })
      })
    })

    return map
  }, [layers, dimensions])

  // Only show connections when a node is hovered (reduces visual clutter)
  const visibleLinks = useMemo(() => {
    // Don't show any connections if nothing is hovered
    if (!hoveredNodeId) return []

    const currentLayerNodeIds = new Set(
      layers.find(l => l.layerIndex === currentLayer)?.nodes.map(n => n.id) || []
    )

    // Only show connections involving the hovered node
    return graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      // Must involve the hovered node
      const involvesHovered = sourceId === hoveredNodeId || targetId === hoveredNodeId
      // Both nodes must be in current layer
      const inCurrentLayer = currentLayerNodeIds.has(sourceId) && currentLayerNodeIds.has(targetId)

      return involvesHovered && inCurrentLayer
    })
  }, [graphData.links, layers, currentLayer, hoveredNodeId])

  // Keyboard panning (WASD and Arrow keys)
  useEffect(() => {
    if (!isMounted) return

    const PAN_SPEED = 15

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()
      keysPressed.current.add(key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current.delete(key)
    }

    // Animation loop for smooth panning
    let animationId: number
    const updatePan = () => {
      const keys = keysPressed.current
      let dx = 0
      let dy = 0

      // WASD or Arrow keys for panning
      if (keys.has('a') || keys.has('arrowleft')) dx += PAN_SPEED
      if (keys.has('d') || keys.has('arrowright')) dx -= PAN_SPEED
      if (keys.has('w') || keys.has('arrowup')) dy += PAN_SPEED
      if (keys.has('s') || keys.has('arrowdown')) dy -= PAN_SPEED

      if (dx !== 0 || dy !== 0) {
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      }

      animationId = requestAnimationFrame(updatePan)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    animationId = requestAnimationFrame(updatePan)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animationId)
    }
  }, [isMounted])

  // Mouse drag panning
  useEffect(() => {
    if (!isMounted) return

    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      // Only pan with left mouse button
      if (e.button !== 0) return
      // Don't pan if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return

      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y
      }
      container.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return

      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y

      setPanOffset({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
      container.style.cursor = 'grab'
    }

    container.style.cursor = 'grab'
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMounted, isDragging, panOffset.x, panOffset.y])

  // Reset pan with R key
  useEffect(() => {
    const handleReset = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        setPanOffset({ x: 0, y: 0 })
      }
    }

    window.addEventListener('keydown', handleReset)
    return () => window.removeEventListener('keydown', handleReset)
  }, [])

  // Handle node hover with tooltip positioning
  const handleNodeHover = useCallback((userId: string | null) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    if (userId) {
      setHoveredNodeId(userId)
    } else {
      // Delay hiding to allow moving to tooltip
      hideTimeoutRef.current = setTimeout(() => {
        if (!isTooltipHovered) {
          setHoveredNodeId(null)
          setTooltipPosition(null)
        }
      }, 150)
    }
  }, [isTooltipHovered])

  // Track mouse for tooltip
  useEffect(() => {
    if (!hoveredNodeId) {
      setTooltipPosition(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [hoveredNodeId])

  // Handle deep zoom to enter a bubble
  const handleDeepZoom = useCallback((direction: 'in' | 'out') => {
    if (direction === 'in' && selectedUserId && onDeepZoom) {
      onDeepZoom(selectedUserId)
    }
  }, [selectedUserId, onDeepZoom])

  // Find hovered node for tooltip
  const hoveredNode = useMemo(() => {
    if (!hoveredNodeId) return null
    return graphData.nodes.find(n => n.id === hoveredNodeId) || null
  }, [hoveredNodeId, graphData.nodes])

  // Determine what to show
  const showEmpty = graphData.nodes.length === 0
  const showContent = isMounted && !showEmpty

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* Loading state while measuring or empty state */}
      {(!isMounted || showEmpty) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white to-gray-200 z-50">
          <div className="text-center text-gray-500">
            {showEmpty ? (
              <>
                <div className="text-6xl mb-4">🌐</div>
                <h2 className="text-2xl font-bold mb-2">No connections yet</h2>
                <p className="text-gray-400">The network will appear here once users join.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading network...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 25%, #e8e8e8 50%, #d0d0d0 75%, #b8b8b8 100%)'
        }}
      />

      {/* Pannable content container */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute opacity-30"
          style={{
            top: -1000,
            left: -1000,
            right: -1000,
            bottom: -1000,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Connection layer (below tiles) */}
        {showContent && (
          <ConnectionLayer
            links={visibleLinks}
            nodePositions={nodePositions}
            hoveredNodeId={hoveredNodeId}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}

        {/* Z-Axis controlled layers */}
        {showContent && (
          <ZAxisController
            currentLayer={currentLayer}
            totalLayers={layers.length}
            onLayerChange={setCurrentLayer}
            onDeepZoom={handleDeepZoom}
            layerSpacing={DEFAULT_LAYER_CONFIG.layerSpacing}
          >
            {layers.map((layer) => (
              <IsometricGrid
                key={layer.layerIndex}
                nodes={layer.nodes}
                links={graphData.links}
                layerIndex={layer.layerIndex}
                isActive={layer.isActive}
                onNodeClick={onNodeClick}
                onNodeHover={handleNodeHover}
                selectedUserId={selectedUserId}
                width={dimensions.width}
                height={dimensions.height}
                onFollowChange={onRefresh}
                onlineUserIds={onlineUserIds}
                streamingUserIds={streamingUserIds}
              />
            ))}
          </ZAxisController>
        )}
      </div>

      {/* Tooltip */}
      <NetworkTooltip
        node={hoveredNode}
        position={tooltipPosition}
        onFollowChange={onRefresh}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
          }
          setIsTooltipHovered(true)
        }}
        onMouseLeave={() => {
          setIsTooltipHovered(false)
          setHoveredNodeId(null)
          setTooltipPosition(null)
        }}
      />

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <p className="text-sm">
            <span className="text-white/60">Total: </span>
            <span className="font-bold">{graphData.nodes.length}</span>
            <span className="text-white/60"> users</span>
          </p>
          {graphData.links.length > 0 && (
            <p className="text-sm">
              <span className="text-white/60">Connections: </span>
              <span className="font-bold">{graphData.links.length}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
