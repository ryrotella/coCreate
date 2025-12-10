'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

interface ZAxisControllerProps {
  currentLayer: number
  totalLayers: number
  onLayerChange: (layer: number) => void
  onDeepZoom?: (direction: 'in' | 'out') => void
  layerSpacing?: number
  children: React.ReactNode
}

export default function ZAxisController({
  currentLayer,
  totalLayers,
  onLayerChange,
  onDeepZoom,
  layerSpacing = 200,
  children
}: ZAxisControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cameraZ, setCameraZ] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Smooth scroll handling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    if (isTransitioning) return

    const delta = e.deltaY
    const sensitivity = 0.5
    const newZ = Math.max(0, Math.min(
      cameraZ + delta * sensitivity,
      (totalLayers - 1) * layerSpacing + layerSpacing * 0.5 // Allow slight overshoot
    ))

    setCameraZ(newZ)

    // Determine which layer should be active based on camera position
    const activeLayer = Math.round(newZ / layerSpacing)
    const clampedLayer = Math.max(0, Math.min(activeLayer, totalLayers - 1))

    if (clampedLayer !== currentLayer) {
      setIsTransitioning(true)
      onLayerChange(clampedLayer)

      // Reset transition lock after animation
      setTimeout(() => setIsTransitioning(false), 300)
    }

    // Check for deep zoom (entering a bubble)
    if (newZ > (totalLayers - 1) * layerSpacing + layerSpacing * 0.3) {
      onDeepZoom?.('in')
    } else if (newZ < -layerSpacing * 0.3) {
      onDeepZoom?.('out')
    }
  }, [cameraZ, currentLayer, totalLayers, layerSpacing, onLayerChange, onDeepZoom, isTransitioning])

  // Set up wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (currentLayer > 0) {
          onLayerChange(currentLayer - 1)
          setCameraZ((currentLayer - 1) * layerSpacing)
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (currentLayer < totalLayers - 1) {
          onLayerChange(currentLayer + 1)
          setCameraZ((currentLayer + 1) * layerSpacing)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentLayer, totalLayers, layerSpacing, onLayerChange])

  // Sync camera Z with current layer when layer changes externally
  useEffect(() => {
    setCameraZ(currentLayer * layerSpacing)
  }, [currentLayer, layerSpacing])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-visible perspective-container"
    >
      {/* 3D scene container */}
      <div
        className="absolute inset-0 preserve-3d"
        style={{
          transform: `translateZ(${-cameraZ}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>

      {/* Layer indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {Array.from({ length: totalLayers }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              onLayerChange(i)
              setCameraZ(i * layerSpacing)
            }}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              currentLayer === i
                ? 'bg-purple-500 scale-125 shadow-lg shadow-purple-500/50'
                : 'bg-gray-400 hover:bg-gray-300'
            }`}
            title={`Layer ${i + 1}`}
          />
        ))}
      </div>

      {/* Layer label */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
          <span className="text-white/60">Layer </span>
          <span className="font-bold">{currentLayer + 1}</span>
          <span className="text-white/60"> / {totalLayers}</span>
        </div>
      </div>

      {/* Scroll hint */}
      {totalLayers > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Scroll to explore layers
          </div>
        </div>
      )}
    </div>
  )
}
