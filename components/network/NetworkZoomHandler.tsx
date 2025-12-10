'use client'

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NetworkNode } from '@/types'

interface NetworkZoomHandlerProps {
  nodes: NetworkNode[]
  onZoomIn: (userId: string) => void
  zoomInThreshold?: number
  enabled?: boolean
}

export default function NetworkZoomHandler({
  nodes,
  onZoomIn,
  zoomInThreshold = 12,
  enabled = true
}: NetworkZoomHandlerProps) {
  const { camera } = useThree()
  const transitionTriggered = useRef(false)
  const cooldownRef = useRef(true)
  const lastCameraZ = useRef<number>(camera.position.z)

  // Add cooldown on mount to prevent immediate transitions
  useEffect(() => {
    transitionTriggered.current = false
    cooldownRef.current = true

    const timeout = setTimeout(() => {
      cooldownRef.current = false
    }, 1500)

    return () => clearTimeout(timeout)
  }, [])

  useFrame(() => {
    if (!enabled || cooldownRef.current || transitionTriggered.current || nodes.length === 0) {
      return
    }

    // Only check when zooming in (camera Z decreasing or getting closer)
    const isZoomingIn = camera.position.z < lastCameraZ.current - 0.5
    lastCameraZ.current = camera.position.z

    if (!isZoomingIn) return

    // Find the nearest bubble to the camera
    let nearestNode: NetworkNode | null = null
    let nearestDistance = Infinity

    for (const node of nodes) {
      const nodePos = new THREE.Vector3(
        node.x || 0,
        node.y || 0,
        node.z || 0
      )
      const distance = camera.position.distanceTo(nodePos)

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestNode = node
      }
    }

    // If close enough to a bubble, trigger transition
    if (nearestNode && nearestDistance < zoomInThreshold) {
      transitionTriggered.current = true
      onZoomIn(nearestNode.id)
    }
  })

  return null
}
