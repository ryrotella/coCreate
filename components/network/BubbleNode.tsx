'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkNode } from '@/types'

interface BubbleNodeProps {
  node: NetworkNode
  onClick: () => void
  isSelected: boolean
}

export default function BubbleNode({ node, onClick, isSelected }: BubbleNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Calculate size based on node count (more content = bigger bubble)
  // Larger base size for better visibility
  const baseSize = 3.5
  const sizeMultiplier = Math.min(1 + node.nodeCount * 0.15, 2.5)
  const size = baseSize * sizeMultiplier

  // Position from simulation
  const position: [number, number, number] = [
    node.x || 0,
    node.y || 0,
    node.z || 0
  ]

  // Generate a unique vibrant color based on username
  // Using higher saturation and lightness for more visibility
  const hue = (node.username.charCodeAt(0) * 137 + node.username.length * 47) % 360
  const baseColor = new THREE.Color().setHSL(hue / 360, 0.85, 0.55)
  const hoverColor = new THREE.Color().setHSL(hue / 360, 0.95, 0.65)
  const glowColor = new THREE.Color().setHSL(hue / 360, 0.9, 0.6)
  const selectedColor = new THREE.Color('#ffffff')

  // Gentle floating animation with glow pulse
  useFrame((state) => {
    if (meshRef.current) {
      const offset = node.id.charCodeAt(0) * 0.1
      meshRef.current.position.y = (node.y || 0) + Math.sin(state.clock.elapsedTime * 0.5 + offset) * 0.5

      // Pulse effect when selected or hovered
      if (isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08
        meshRef.current.scale.setScalar(scale)
      } else if (hovered) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
        meshRef.current.scale.setScalar(scale)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }

    // Animate outer glow
    if (glowRef.current) {
      const glowPulse = 0.15 + Math.sin(state.clock.elapsedTime * 1.5 + node.id.charCodeAt(0) * 0.2) * 0.1
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = hovered ? 0.4 : glowPulse
    }
  })

  // Get display name or username
  const displayName = node.displayName || node.username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <group position={position}>
      {/* Outer glow sphere (always visible, pulsing) */}
      <mesh ref={glowRef} scale={1.3}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main bubble sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? selectedColor : hovered ? hoverColor : baseColor}
          transparent
          opacity={0.95}
          roughness={0.15}
          metalness={0.2}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0.2}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh scale={0.6}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={hoverColor}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Outer ring when selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.4, 0.15, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Username label */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, -size - 1.5, 0]}
      >
        <Text
          fontSize={1.2}
          color="#333333"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.08}
          outlineColor="#ffffff"
          fontWeight="bold"
        >
          @{node.username}
        </Text>
      </Billboard>

      {/* Hover detail card */}
      {hovered && (
        <Html
          position={[size + 2, 0, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/90 backdrop-blur-lg rounded-lg p-3 border border-white/20 min-w-[150px]">
            <div className="flex items-center gap-2 mb-2">
              {node.avatarUrl ? (
                <img
                  src={node.avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm">{displayName}</p>
                <p className="text-white/60 text-xs">@{node.username}</p>
              </div>
            </div>
            <p className="text-white/80 text-xs">
              {node.nodeCount} node{node.nodeCount !== 1 ? 's' : ''} in bubble
            </p>
            <p className="text-purple-400 text-xs mt-1">Click to visit →</p>
          </div>
        </Html>
      )}
    </group>
  )
}
