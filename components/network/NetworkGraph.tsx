'use client'

import { useRef, useEffect, useState } from 'react'
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide
} from 'd3-force-3d'
import { NetworkGraphData, NetworkNode, NetworkLink } from '@/types'
import BeaconNode from './BeaconNode'
import ConnectionEdge from './ConnectionEdge'

interface NetworkGraphProps {
  graphData: NetworkGraphData
  onBubbleClick: (userId: string) => void
  selectedUserId: string | null
}

export default function NetworkGraph({ graphData, onBubbleClick, selectedUserId }: NetworkGraphProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [simulatedNodes, setSimulatedNodes] = useState<NetworkNode[]>([])
  const [simulatedLinks, setSimulatedLinks] = useState<NetworkLink[]>([])

  // Initialize and run force simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return

    // Create copies for simulation - beacons are on ground plane (XZ)
    const nodesCopy = graphData.nodes.map(n => ({
      ...n,
      y: 0 // Force Y to 0 for ground-level simulation
    }))
    const linksCopy = graphData.links.map(l => ({ ...l }))

    // Create 2D force simulation (beacons spread on ground plane)
    const simulation = forceSimulation(nodesCopy, 2) // 2D simulation for XZ plane
      .force('charge', forceManyBody().strength(-200)) // Stronger repulsion for spacing
      .force('center', forceCenter(0, 0))
      .force('collision', forceCollide().radius(8)) // Larger radius for beacon spacing
      .force('link', forceLink(linksCopy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .id((d: any) => d.id)
        .distance(30) // More distance between connected beacons
        .strength(0.3)
      )
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    // Run simulation
    simulation.on('tick', () => {
      // Map 2D simulation results back to 3D (y becomes z for ground plane)
      const mappedNodes = nodesCopy.map(n => ({
        ...n,
        x: n.x || 0,
        y: 0, // Keep on ground
        z: n.y || 0 // 2D sim's y becomes our z
      }))
      setSimulatedNodes([...mappedNodes])
      setSimulatedLinks([...linksCopy])
    })

    // Run simulation
    simulation.alpha(1).restart()

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [graphData])

  // If no nodes yet, show nothing
  if (simulatedNodes.length === 0 && graphData.nodes.length > 0) {
    return null
  }

  const nodesToRender = simulatedNodes.length > 0 ? simulatedNodes : graphData.nodes

  return (
    <group ref={groupRef}>
      {/* Render connection edges first (behind beacons) */}
      {simulatedLinks.map((link, index) => (
        <ConnectionEdge key={`edge-${index}`} link={link} />
      ))}

      {/* Render beacon nodes */}
      {nodesToRender.map((node) => (
        <BeaconNode
          key={node.id}
          node={node}
          onClick={() => onBubbleClick(node.id)}
          isSelected={selectedUserId === node.id}
        />
      ))}
    </group>
  )
}
