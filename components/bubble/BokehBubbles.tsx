'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function BokehBubbles() {
  const groupRef = useRef<THREE.Group>(null)

  // Generate random bubble positions and properties
  const bubbles = useMemo(() => {
    const count = 30
    const items = []

    for (let i = 0; i < count; i++) {
      // Random position around the edge (further out)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = 25 + Math.random() * 10

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      items.push({
        id: i,
        position: [x, y, z] as [number, number, number],
        scale: 0.5 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.2,
      })
    }

    return items
  }, [])

  // Animate bubbles gently
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((bubble, i) => {
        const item = bubbles[i]
        const time = state.clock.elapsedTime

        // Gentle floating
        bubble.position.y += Math.sin(time * item.speed + item.offset) * 0.002
        bubble.position.x += Math.cos(time * item.speed * 0.5 + item.offset) * 0.001

        // Subtle scale pulse
        const pulse = Math.sin(time * item.speed + item.offset) * 0.1 + 1
        bubble.scale.setScalar(item.scale * pulse)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble) => (
        <mesh key={bubble.id} position={bubble.position}>
          <sphereGeometry args={[bubble.scale, 16, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={bubble.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
