'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { BucketWithNodes } from '@/types'
import { useUIStore } from '@/stores/uiStore'

interface BucketObjectProps {
  bucket: BucketWithNodes
  onToggleExpand?: (bucketId: string) => void
  onNodeDrop?: (bucketId: string, nodeId: string) => void
}

export default function BucketObject({ bucket, onToggleExpand }: BucketObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { isEditMode, nodeDetailModalOpen } = useUIStore()

  // Parse bucket color
  const bucketColor = useMemo(() => new THREE.Color(bucket.color), [bucket.color])

  // Floating animation
  useFrame((state) => {
    if (groupRef.current && !isEditMode) {
      const time = state.clock.elapsedTime
      // Gentle floating
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.15
      // Slow rotation
      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.003
      }
    }
  })

  const handleClick = () => {
    if (onToggleExpand) {
      onToggleExpand(bucket.id)
    }
  }

  const handlePointerOver = () => {
    setHovered(true)
    document.body.style.cursor = isEditMode ? 'grab' : 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }

  // Calculate node positions in a circular pattern when expanded
  const nodePositions = useMemo(() => {
    if (!bucket.is_expanded || !bucket.nodes) return []

    return bucket.nodes.map((_, index) => {
      const total = bucket.nodes.length
      const angle = (index / total) * Math.PI * 2
      const radius = 2.5 + Math.floor(index / 8) * 1.5 // Spiral out for more nodes
      return {
        x: Math.cos(angle) * radius,
        y: 0.5 + (index % 3) * 0.5, // Vary height slightly
        z: Math.sin(angle) * radius,
      }
    })
  }, [bucket.is_expanded, bucket.nodes])

  return (
    <group
      ref={groupRef}
      position={[bucket.position_x, bucket.position_y, bucket.position_z]}
    >
      {/* Main bucket sphere - semi-transparent container */}
      <mesh
        ref={sphereRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={bucket.scale * (hovered ? 1.1 : 1) * (bucket.is_expanded ? 1.5 : 1)}
      >
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial
          color={bucketColor}
          transparent
          opacity={bucket.is_expanded ? 0.15 : 0.4}
          emissive={bucketColor}
          emissiveIntensity={hovered ? 0.4 : 0.2}
          wireframe={bucket.is_expanded}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Inner glow */}
      {!bucket.is_expanded && (
        <mesh scale={0.9}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={bucketColor}
            transparent
            opacity={0.1}
          />
        </mesh>
      )}

      {/* Node count indicator (hide when modal is open) */}
      {!bucket.is_expanded && bucket.nodes && bucket.nodes.length > 0 && !nodeDetailModalOpen && (
        <Html
          position={[0, -1.5, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full">
            {bucket.nodes.length} {bucket.nodes.length === 1 ? 'node' : 'nodes'}
          </div>
        </Html>
      )}

      {/* Bucket name */}
      <Billboard follow={true}>
        <Text
          position={[0, bucket.is_expanded ? 2.5 : 1.8, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
          maxWidth={3}
        >
          {bucket.name}
        </Text>
      </Billboard>

      {/* Hover tooltip with more info (hide when modal is open) */}
      {hovered && !bucket.is_expanded && !nodeDetailModalOpen && (
        <Html
          position={[2, 0, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/95 backdrop-blur-lg rounded-lg p-3 border border-white/20 shadow-2xl min-w-48">
            <div className="text-white font-bold text-sm mb-1">{bucket.name}</div>
            {bucket.description && (
              <div className="text-white/60 text-xs mb-2">{bucket.description}</div>
            )}
            <div className="text-white/40 text-xs">
              Click to {bucket.nodes?.length > 0 ? 'expand' : 'view'}
            </div>
            {bucket.nodes && bucket.nodes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-white/60 text-xs">
                  Contains {bucket.nodes.length} {bucket.nodes.length === 1 ? 'node' : 'nodes'}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Expanded state: Show nodes in orbit */}
      {bucket.is_expanded && bucket.nodes && bucket.nodes.map((bucketNode, index) => {
        const pos = nodePositions[index]
        if (!pos) return null

        return (
          <group key={bucketNode.id} position={[pos.x, pos.y, pos.z]}>
            {/* Mini node preview */}
            <mesh>
              <boxGeometry args={[0.6, 0.6, 0.1]} />
              <meshStandardMaterial
                color={bucketNode.node.type === 'image' ? '#4ecdc4' :
                       bucketNode.node.type === 'text' ? '#ff6b6b' :
                       bucketNode.node.type === 'link' ? '#ffe66d' :
                       bucketNode.node.type === 'video' ? '#e74c3c' : '#95a5a6'}
                emissive={bucketNode.node.type === 'image' ? '#4ecdc4' :
                         bucketNode.node.type === 'text' ? '#ff6b6b' :
                         bucketNode.node.type === 'link' ? '#ffe66d' :
                         bucketNode.node.type === 'video' ? '#e74c3c' : '#95a5a6'}
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Connection line to center */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, 0, 0, -pos.x, -pos.y, -pos.z]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={bucket.color} transparent opacity={0.3} />
            </line>
            {/* Attribution badge (hide when modal is open) */}
            {!nodeDetailModalOpen && (
              <Html position={[0, -0.5, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="bg-black/80 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
                  {bucketNode.node.title.substring(0, 15)}{bucketNode.node.title.length > 15 ? '...' : ''}
                </div>
              </Html>
            )}
          </group>
        )
      })}

      {/* Drop zone indicator when dragging in edit mode */}
      {isEditMode && (
        <mesh
          visible={false}
          scale={2}
        >
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}
