'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ZoomTransitionProps {
  // Called when zoomed in past threshold (for network -> bubble transition)
  onZoomIn?: () => void
  // Called when zoomed out past threshold (for bubble -> network transition)
  onZoomOut?: () => void
  // Distance thresholds
  zoomInThreshold?: number
  zoomOutThreshold?: number
  // Target position for zoom-in detection (optional, for network view)
  targetPosition?: THREE.Vector3 | null
  // Enabled state
  enabled?: boolean
  // Mode: 'network' or 'bubble'
  mode: 'network' | 'bubble'
}

export default function ZoomTransition({
  onZoomIn,
  onZoomOut,
  zoomInThreshold = 8,
  zoomOutThreshold = 40,
  targetPosition,
  enabled = true,
  mode
}: ZoomTransitionProps) {
  const { camera } = useThree()
  const lastDistance = useRef<number>(0)
  const transitionTriggered = useRef(false)
  const cooldownRef = useRef(false)

  // Reset cooldown when component unmounts or mode changes
  useEffect(() => {
    transitionTriggered.current = false
    cooldownRef.current = false

    // Add a short cooldown when first mounting to prevent immediate transitions
    cooldownRef.current = true
    const timeout = setTimeout(() => {
      cooldownRef.current = false
    }, 1000)

    return () => clearTimeout(timeout)
  }, [mode])

  useFrame(() => {
    if (!enabled || cooldownRef.current) return

    // Calculate distance from camera to origin (or target)
    const target = targetPosition || new THREE.Vector3(0, 0, 0)
    const distance = camera.position.distanceTo(target)

    // Only trigger if distance changed significantly (scrolling)
    const distanceChanged = Math.abs(distance - lastDistance.current) > 0.5
    lastDistance.current = distance

    if (!distanceChanged || transitionTriggered.current) return

    if (mode === 'network') {
      // In network view, zoom in = enter bubble
      if (distance < zoomInThreshold && onZoomIn) {
        transitionTriggered.current = true
        onZoomIn()
      }
    } else if (mode === 'bubble') {
      // In bubble view, zoom out = return to network
      if (distance > zoomOutThreshold && onZoomOut) {
        transitionTriggered.current = true
        onZoomOut()
      }
    }
  })

  return null
}
