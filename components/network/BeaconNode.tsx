'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkNode } from '@/types'

interface BeaconNodeProps {
  node: NetworkNode
  onClick: () => void
  isSelected: boolean
}

export default function BeaconNode({ node, onClick, isSelected }: BeaconNodeProps) {
  const beamRef = useRef<THREE.Mesh>(null)
  const markerRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const pulseRingRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Calculate height based on node count (more content = taller beacon)
  const baseHeight = 8
  const heightMultiplier = Math.min(1 + node.nodeCount * 0.1, 2)
  const beaconHeight = baseHeight * heightMultiplier

  // Position - beacons sit on the ground plane
  const groundY = -2
  const position: [number, number, number] = [
    node.x || 0,
    groundY,
    node.z || 0
  ]

  // Generate unique color based on username
  const hue = (node.username.charCodeAt(0) * 137 + node.username.length * 47) % 360
  const baseColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.8, 0.55), [hue])
  const glowColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.9, 0.65), [hue])
  const beamColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.7, 0.7), [hue])

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime
    const offset = node.id.charCodeAt(0) * 0.1

    // Beam opacity pulse
    if (beamRef.current) {
      const material = beamRef.current.material as THREE.MeshBasicMaterial
      const basePulse = 0.3 + Math.sin(time * 2 + offset) * 0.15
      material.opacity = hovered ? 0.6 : isSelected ? 0.5 : basePulse
    }

    // Marker gentle bob
    if (markerRef.current) {
      markerRef.current.position.y = beaconHeight + Math.sin(time * 1.5 + offset) * 0.3

      // Rotate marker slowly
      markerRef.current.rotation.y = time * 0.5 + offset
    }

    // Base ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.3
    }

    // Pulse ring expansion
    if (pulseRingRef.current) {
      const pulse = (time * 0.5 + offset) % 2
      const scale = 1 + pulse * 0.5
      pulseRingRef.current.scale.set(scale, scale, 1)
      const material = pulseRingRef.current.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 0.4 - pulse * 0.2)
    }
  })

  // Get display info
  const displayName = node.displayName || node.username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <group position={position}>
      {/* Ground base ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[1.5, 2, 32]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Animated pulse ring on ground */}
      <mesh
        ref={pulseRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      >
        <ringGeometry args={[2, 2.3, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center platform */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 0.2, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Vertical light beam */}
      <mesh
        ref={beamRef}
        position={[0, beaconHeight / 2, 0]}
      >
        <cylinderGeometry args={[0.15, 0.4, beaconHeight, 16, 1, true]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer beam glow */}
      <mesh position={[0, beaconHeight / 2, 0]}>
        <cylinderGeometry args={[0.5, 0.8, beaconHeight, 16, 1, true]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Floating marker at top */}
      <group ref={markerRef} position={[0, beaconHeight, 0]}>
        {/* Diamond/crystal shape */}
        <mesh
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
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial
            color={isSelected ? '#ffffff' : hovered ? glowColor : baseColor}
            emissive={baseColor}
            emissiveIntensity={isSelected ? 0.8 : hovered ? 0.6 : 0.4}
            metalness={0.7}
            roughness={0.2}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Inner glow core */}
        <mesh scale={0.6}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.1, 16, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        )}

        {/* Hover ring */}
        {hovered && !isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.6, 0.08, 16, 32]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
          </mesh>
        )}
      </group>

      {/* Username label */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, beaconHeight + 2.5, 0]}
      >
        <Text
          fontSize={1.0}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#ffffff"
          fontWeight="bold"
        >
          @{node.username}
        </Text>
      </Billboard>

      {/* Node count indicator */}
      <Billboard
        follow={true}
        position={[0, -0.5, 2.5]}
      >
        <Text
          fontSize={0.7}
          color="#666666"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#ffffff"
        >
          {node.nodeCount} item{node.nodeCount !== 1 ? 's' : ''}
        </Text>
      </Billboard>

      {/* Hover detail card */}
      {hovered && (
        <Html
          position={[3, beaconHeight / 2, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/90 backdrop-blur-lg rounded-lg p-3 border border-white/20 min-w-[160px] shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              {node.avatarUrl ? (
                <img
                  src={node.avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full border-2"
                  style={{ borderColor: `hsl(${hue}, 70%, 50%)` }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
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
            <div className="border-t border-white/10 pt-2 mt-2">
              <p className="text-white/80 text-xs flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}></span>
                {node.nodeCount} item{node.nodeCount !== 1 ? 's' : ''} in space
              </p>
            </div>
            <p className="text-purple-400 text-xs mt-2 font-medium">Click to enter space →</p>
          </div>
        </Html>
      )}
    </group>
  )
}
