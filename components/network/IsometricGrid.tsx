'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { NetworkNode, NetworkLink } from '@/types'
import IsometricTile from './IsometricTile'

interface NodePosition {
  id: string
  x: number
  y: number
}

interface IsometricGridProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  layerIndex: number
  isActive: boolean
  onNodeClick: (userId: string) => void
  onNodeHover: (userId: string | null) => void
  selectedUserId: string | null
  width: number
  height: number
  tileSize?: number
  onFollowChange?: () => void
  onlineUserIds?: string[]
  streamingUserIds?: string[]
}

// Simulation node type for D3
interface SimulationNode extends NetworkNode {
  x: number
  y: number
  vx?: number
  vy?: number
}

export default function IsometricGrid({
  nodes,
  links,
  layerIndex,
  isActive,
  onNodeClick,
  onNodeHover,
  selectedUserId,
  width,
  height,
  tileSize = 80,
  onFollowChange,
  onlineUserIds = [],
  streamingUserIds = []
}: IsometricGridProps) {
  const [positions, setPositions] = useState<NodePosition[]>([])
  const simulationRef = useRef<d3.Simulation<SimulationNode, d3.SimulationLinkDatum<SimulationNode>> | null>(null)

  // Convert cartesian coordinates to isometric screen coordinates
  const toIsometric = useCallback((x: number, y: number) => {
    // Isometric projection formula
    const isoX = (x - y) * Math.cos(Math.PI / 6)
    const isoY = (x + y) * Math.sin(Math.PI / 6)
    return {
      x: isoX + width / 2,
      y: isoY + height / 2
    }
  }, [width, height])

  // Initialize and run force simulation
  useEffect(() => {
    if (nodes.length === 0) {
      setPositions([])
      return
    }

    // Create simulation nodes with initial positions
    const simNodes: SimulationNode[] = nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * width * 0.5,
      y: (Math.random() - 0.5) * height * 0.5
    }))

    // Create simulation links (map string IDs to node objects)
    const simLinks = links.map(l => ({
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id
    }))

    // Create force simulation with stronger repulsion for cleaner spacing
    const simulation = d3.forceSimulation<SimulationNode>(simNodes)
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(tileSize * 1.4))
      .force('link', d3.forceLink(simLinks)
        .id((d: d3.SimulationNodeDatum) => (d as SimulationNode).id)
        .distance(tileSize * 3)
        .strength(0.2)
      )
      .force('x', d3.forceX(0).strength(0.03))
      .force('y', d3.forceY(0).strength(0.03))
      .alphaDecay(0.02)
      .velocityDecay(0.3)

    // Update positions on tick
    simulation.on('tick', () => {
      const newPositions = simNodes.map(n => {
        const iso = toIsometric(n.x, n.y)
        return {
          id: n.id,
          x: iso.x - tileSize / 2,
          y: iso.y - tileSize / 2
        }
      })
      setPositions([...newPositions])
    })

    // Start simulation
    simulation.alpha(1).restart()
    simulationRef.current = simulation

    // Cleanup
    return () => {
      simulation.stop()
      simulationRef.current = null
    }
  }, [nodes, links, width, height, tileSize, toIsometric])

  // Handle node hover
  const handleNodeHover = useCallback((userId: string, hovering: boolean) => {
    onNodeHover(hovering ? userId : null)
  }, [onNodeHover])

  // If no positions calculated yet, show loading state
  if (positions.length === 0 && nodes.length > 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="network-layer"
      data-depth={layerIndex}
      style={{
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      {/* Render tiles */}
      {nodes.map((node) => {
        const position = positions.find(p => p.id === node.id) || { x: width / 2, y: height / 2 }
        const isOnline = onlineUserIds.includes(node.id)
        const isStreaming = streamingUserIds.includes(node.id)
        return (
          <IsometricTile
            key={node.id}
            node={node}
            position={position}
            isSelected={selectedUserId === node.id}
            isOnline={isOnline}
            isStreaming={isStreaming}
            onClick={() => onNodeClick(node.id)}
            onHover={(hovering) => handleNodeHover(node.id, hovering)}
            layerDepth={layerIndex}
            tileSize={tileSize}
            onFollowChange={onFollowChange}
          />
        )
      })}
    </div>
  )
}
