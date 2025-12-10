'use client'

import { useMemo } from 'react'
import { NetworkLink } from '@/types'

interface NodePosition {
  id: string
  x: number
  y: number
  layer: number
}

interface ConnectionLayerProps {
  links: NetworkLink[]
  nodePositions: Map<string, NodePosition>
  hoveredNodeId: string | null
  width: number
  height: number
  tileSize?: number
}

// Connection colors by type (matching ConnectionEdge.tsx)
const CONNECTION_COLORS = {
  follow: '#8b5cf6',      // purple
  collaboration: '#06b6d4', // cyan
  inspiration: '#f59e0b'   // amber
}

export default function ConnectionLayer({
  links,
  nodePositions,
  hoveredNodeId,
  width,
  height,
  tileSize = 80
}: ConnectionLayerProps) {
  // Generate curved paths for connections
  const paths = useMemo(() => {
    return links.map((link, index) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      const sourcePos = nodePositions.get(sourceId)
      const targetPos = nodePositions.get(targetId)

      if (!sourcePos || !targetPos) return null

      // Offset to center of tile
      const sx = sourcePos.x + tileSize / 2
      const sy = sourcePos.y + tileSize / 2
      const tx = targetPos.x + tileSize / 2
      const ty = targetPos.y + tileSize / 2

      // Calculate midpoint with curve offset
      const mx = (sx + tx) / 2
      const my = (sy + ty) / 2

      // Add perpendicular offset for curve
      const dx = tx - sx
      const dy = ty - sy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const curveOffset = Math.min(dist * 0.2, 40) // Cap curve at 40px

      // Perpendicular direction
      const px = -dy / dist * curveOffset
      const py = dx / dist * curveOffset

      // Control point for quadratic bezier
      const cx = mx + px
      const cy = my + py

      // Check if this connection involves the hovered node
      const isHighlighted = hoveredNodeId && (sourceId === hoveredNodeId || targetId === hoveredNodeId)

      // Check if connection crosses layers
      const crossLayer = sourcePos.layer !== targetPos.layer

      return {
        id: `${sourceId}-${targetId}-${index}`,
        path: `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`,
        color: CONNECTION_COLORS[link.type] || CONNECTION_COLORS.follow,
        isHighlighted,
        crossLayer,
        type: link.type
      }
    }).filter(Boolean)
  }, [links, nodePositions, hoveredNodeId, tileSize])

  if (links.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 1 }}
    >
      <defs>
        {/* Gradient definitions for each connection type */}
        <linearGradient id="gradient-follow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="gradient-collaboration" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="gradient-inspiration" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
        </linearGradient>

        {/* Animated dash pattern */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        {paths.map((p) => p && (
          <g key={p.id}>
            {/* Background glow for highlighted connections */}
            {p.isHighlighted && (
              <path
                d={p.path}
                fill="none"
                stroke={p.color}
                strokeWidth={6}
                strokeOpacity={0.3}
                filter="url(#glow)"
              />
            )}

            {/* Main connection line */}
            <path
              d={p.path}
              fill="none"
              stroke={`url(#gradient-${p.type})`}
              strokeWidth={p.isHighlighted ? 3 : 2}
              strokeOpacity={p.crossLayer ? 0.4 : p.isHighlighted ? 1 : 0.6}
              strokeLinecap="round"
              strokeDasharray={p.crossLayer ? '8 4' : 'none'}
              className={p.isHighlighted ? 'animate-pulse' : ''}
            />

            {/* Animated flow particles (for highlighted connections) */}
            {p.isHighlighted && (
              <circle r={3} fill={p.color}>
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={p.path}
                />
              </circle>
            )}
          </g>
        ))}
      </g>
    </svg>
  )
}
