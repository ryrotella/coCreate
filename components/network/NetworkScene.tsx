'use client'

import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import NetworkGraph from './NetworkGraph'
import NetworkZoomHandler from './NetworkZoomHandler'
import WorldControls from '@/components/controls/WorldControls'
import { NetworkGraphData } from '@/types'

interface NetworkSceneProps {
  graphData: NetworkGraphData
  onBubbleClick: (userId: string) => void
  selectedUserId: string | null
  onZoomIn?: (userId: string) => void
}

export default function NetworkScene({ graphData, onBubbleClick, selectedUserId, onZoomIn }: NetworkSceneProps) {
  return (
    <div className="relative w-full h-full">
      {/* Iridescent Gradient Background */}
      <div className="absolute inset-0 iridescent-bg" />

      {/* 3D Canvas with transparent background */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        {/* Camera - elevated map view */}
        <PerspectiveCamera makeDefault position={[0, 60, 80]} fov={60} />

        {/* Ambient lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 50, 10]} intensity={1.0} />
        <pointLight position={[-10, 30, -10]} intensity={0.6} color="#8b5cf6" />
        <directionalLight position={[0, 100, 0]} intensity={0.4} />

        {/* Ground plane for map reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[500, 500, 50, 50]} />
          <meshStandardMaterial
            color="#e8e8e8"
            transparent
            opacity={0.6}
            wireframe={false}
          />
        </mesh>

        {/* Grid helper for visual reference */}
        <gridHelper args={[500, 50, '#d0d0d0', '#e0e0e0']} position={[0, -1.9, 0]} />

        {/* Network Graph */}
        <NetworkGraph
          graphData={graphData}
          onBubbleClick={onBubbleClick}
          selectedUserId={selectedUserId}
        />

        {/* Dual-mode World Controls */}
        <WorldControls baseSpeed={0.8} boostMultiplier={2.5} />

        {/* Zoom Transition - zooming in close enters the space */}
        <NetworkZoomHandler
          nodes={graphData.nodes}
          onZoomIn={onZoomIn || onBubbleClick}
          zoomInThreshold={15}
          enabled={true}
        />
      </Canvas>

      {/* CSS for gray/white gradient */}
      <style jsx>{`
        .iridescent-bg {
          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #f5f5f5 25%,
            #e8e8e8 50%,
            #d0d0d0 75%,
            #b8b8b8 100%
          );
        }
      `}</style>
    </div>
  )
}
