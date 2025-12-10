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

  // Filter links to only show within current layer (for now)
  const visibleLinks = useMemo(() => {
    const currentLayerNodeIds = new Set(
      layers.find(l => l.layerIndex === currentLayer)?.nodes.map(n => n.id) || []
    )

    return graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return currentLayerNodeIds.has(sourceId) && currentLayerNodeIds.has(targetId)
    })
  }, [graphData.links, layers, currentLayer])

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
      className="relative w-full h-full"
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

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
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
