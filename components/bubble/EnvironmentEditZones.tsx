'use client'

import { useState, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useUIStore, EnvironmentEditTarget } from '@/stores/uiStore'
import { useBubbleStore } from '@/stores/bubbleStore'

interface ColorPickerProps {
  position: [number, number, number]
  currentColor: string
  onColorChange: (color: string) => void
  onClose: () => void
  label: string
}

function FloatingColorPicker({ position, currentColor, onColorChange, onClose, label }: ColorPickerProps) {
  const [color, setColor] = useState(currentColor)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value)
    onColorChange(e.target.value)
  }

  return (
    <Html position={position} center style={{ pointerEvents: 'auto' }}>
      <div className="bg-black/90 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-2xl min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold text-sm">{label}</span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg leading-none"
          >
            x
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={handleChange}
            className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-2 border-white/20"
          />
          <input
            type="text"
            value={color}
            onChange={handleChange}
            className="flex-1 bg-white/10 rounded px-3 py-2 text-white text-sm font-mono"
          />
        </div>
      </div>
    </Html>
  )
}

export default function EnvironmentEditZones() {
  const {
    isEnvironmentEditMode,
    environmentEditTarget,
    environmentEditTool,
    setEnvironmentEditTarget,
  } = useUIStore()
  const { environment, updateEnvironment, saveEnvironment } = useBubbleStore()

  const [pickerPosition, setPickerPosition] = useState<[number, number, number]>([0, 5, 0])
  const [hoveredZone, setHoveredZone] = useState<EnvironmentEditTarget>(null)

  const handleZoneClick = useCallback((zone: EnvironmentEditTarget, event: ThreeEvent<MouseEvent>) => {
    if (!isEnvironmentEditMode || environmentEditTool !== 'picker') return

    event.stopPropagation()

    // Get click position for placing the picker
    const point = event.point
    setPickerPosition([point.x, point.y, point.z])
    setEnvironmentEditTarget(zone)
  }, [isEnvironmentEditMode, environmentEditTool, setEnvironmentEditTarget])

  const handleColorChange = useCallback((color: string) => {
    if (!environmentEditTarget) return

    switch (environmentEditTarget) {
      case 'sky':
        updateEnvironment({ skyColor: color })
        break
      case 'ground':
        updateEnvironment({ groundColor: color })
        break
      case 'fog':
        updateEnvironment({ fogColor: color })
        break
    }
  }, [environmentEditTarget, updateEnvironment])

  const handlePickerClose = useCallback(() => {
    setEnvironmentEditTarget(null)
    saveEnvironment()
  }, [setEnvironmentEditTarget, saveEnvironment])

  const getCurrentColor = () => {
    switch (environmentEditTarget) {
      case 'sky':
        return environment.skyColor
      case 'ground':
        return environment.groundColor
      case 'fog':
        return environment.fogColor
      default:
        return '#ffffff'
    }
  }

  const getLabel = () => {
    switch (environmentEditTarget) {
      case 'sky':
        return 'Sky Color'
      case 'ground':
        return 'Ground Color'
      case 'fog':
        return 'Fog Color'
      default:
        return ''
    }
  }

  if (!isEnvironmentEditMode) return null

  return (
    <>
      {/* Sky Zone - Upper hemisphere */}
      <mesh
        position={[0, 20, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => handleZoneClick('sky', e)}
        onPointerOver={() => setHoveredZone('sky')}
        onPointerOut={() => setHoveredZone(null)}
      >
        <ringGeometry args={[0, 40, 64]} />
        <meshBasicMaterial
          color={hoveredZone === 'sky' ? '#4488ff' : '#ffffff'}
          transparent
          opacity={hoveredZone === 'sky' ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ground Zone - Lower area */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => handleZoneClick('ground', e)}
        onPointerOver={() => setHoveredZone('ground')}
        onPointerOut={() => setHoveredZone(null)}
      >
        <ringGeometry args={[5, 25, 64]} />
        <meshBasicMaterial
          color={hoveredZone === 'ground' ? '#44ff88' : '#ffffff'}
          transparent
          opacity={hoveredZone === 'ground' ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fog Zone - Horizon ring */}
      <mesh
        position={[0, 3, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => handleZoneClick('fog', e)}
        onPointerOver={() => setHoveredZone('fog')}
        onPointerOut={() => setHoveredZone(null)}
      >
        <torusGeometry args={[30, 2, 16, 100]} />
        <meshBasicMaterial
          color={hoveredZone === 'fog' ? '#ffaa44' : '#ffffff'}
          transparent
          opacity={hoveredZone === 'fog' ? 0.3 : 0.15}
        />
      </mesh>

      {/* Zone Labels */}
      {hoveredZone === 'sky' && (
        <Html position={[0, 15, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            Click to edit Sky
          </div>
        </Html>
      )}
      {hoveredZone === 'ground' && (
        <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            Click to edit Ground
          </div>
        </Html>
      )}
      {hoveredZone === 'fog' && (
        <Html position={[0, 5, 15]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-orange-500/80 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            Click to edit Fog/Horizon
          </div>
        </Html>
      )}

      {/* Floating Color Picker */}
      {environmentEditTarget && environmentEditTool === 'picker' && (
        <FloatingColorPicker
          position={pickerPosition}
          currentColor={getCurrentColor()}
          onColorChange={handleColorChange}
          onClose={handlePickerClose}
          label={getLabel()}
        />
      )}
    </>
  )
}
