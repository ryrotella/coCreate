'use client'

import { useBubbleStore } from '@/stores/bubbleStore'
import IridescentBackground from './IridescentBackground'
import BokehBubbles from './BokehBubbles'

export default function BubbleEnvironment() {
  const { environment } = useBubbleStore()

  return (
    <>
      {/* White-to-gray gradient background sphere */}
      <IridescentBackground />

      {/* Bokeh bubbles in the distance (hinting at network) */}
      <BokehBubbles />

      {/* Optional bottom platform (subtle shadow catcher) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial
          color="#d0d0d0"
          transparent
          opacity={0.3}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Subtle fog for depth */}
      <fog
        attach="fog"
        args={[
          '#f0f0f0',
          15,
          environment.fogDensity > 0 ? 60 / environment.fogDensity : 1000,
        ]}
      />

      {/* Background color fallback */}
      <color attach="background" args={['#f5f5f5']} />
    </>
  )
}
