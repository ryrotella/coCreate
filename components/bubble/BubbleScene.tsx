'use client'

import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useBubbleStore } from '@/stores/bubbleStore'
import BubbleEnvironment from './BubbleEnvironment'
import NodesContainer from './NodesContainer'
import BucketsContainer from './BucketsContainer'
import EnvironmentEditZones from './EnvironmentEditZones'
import WorldControls from '@/components/controls/WorldControls'
import ZoomTransition from '@/components/controls/ZoomTransition'

interface BubbleSceneProps {
  onZoomOut?: () => void
}

export default function BubbleScene({ onZoomOut }: BubbleSceneProps) {
  const { environment } = useBubbleStore()

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ background: '#f5f5f5' }}
    >
      {/* Camera - slightly elevated view */}
      <PerspectiveCamera makeDefault position={[0, 15, 25]} fov={60} />

      {/* Lights */}
      <ambientLight intensity={environment.lightIntensity * 0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={environment.lightIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight
        args={[environment.skyColor, environment.groundColor, 0.3]}
      />

      {/* Environment (Sky, Ground, Fog) */}
      <BubbleEnvironment />

      {/* Environment Edit Zones (when in environment edit mode) */}
      <EnvironmentEditZones />

      {/* Nodes */}
      <NodesContainer />

      {/* Buckets (3D folders) */}
      <BucketsContainer />

      {/* Dual-mode World Controls */}
      <WorldControls baseSpeed={0.5} boostMultiplier={2} />

      {/* Zoom Transition - zooming out far returns to network */}
      <ZoomTransition
        mode="bubble"
        onZoomOut={onZoomOut}
        zoomOutThreshold={60}
        enabled={!!onZoomOut}
      />
    </Canvas>
  )
}
