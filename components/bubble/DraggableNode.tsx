'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useUIStore } from '@/stores/uiStore'
import { useBubbleStore } from '@/stores/bubbleStore'
import NodeObject from './NodeObject'
import { NodeWithPlacement, BucketWithNodes } from '@/types'

interface DraggableNodeProps {
  node: NodeWithPlacement
}

export default function DraggableNode({ node }: DraggableNodeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const { isEditMode, setDragging } = useUIStore()
  const { updateNode, buckets, addNodeToBucket } = useBubbleStore()

  // Local drag state
  const [isDraggingLocal, setIsDraggingLocal] = useState(false)
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3())
  const [currentY, setCurrentY] = useState<number | null>(null)
  const [nearbyBucket, setNearbyBucket] = useState<BucketWithNodes | null>(null)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const raycaster = useRef(new THREE.Raycaster())

  // Check if node is near any bucket during drag
  const checkNearbyBucket = useCallback((x: number, z: number) => {
    const BUCKET_DETECTION_RADIUS = 3.0

    for (const bucket of buckets) {
      const dx = x - bucket.position_x
      const dz = z - bucket.position_z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < BUCKET_DETECTION_RADIUS) {
        return bucket
      }
    }
    return null
  }, [buckets])

  // Get current position
  const position: [number, number, number] = node.placement
    ? [node.placement.position_x, node.placement.position_y, node.placement.position_z]
    : [0, 1.5, 0]

  // Convert screen coordinates to world position on drag plane
  const getWorldPosition = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1

    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera)

    const intersection = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(dragPlane.current, intersection)

    return intersection
  }, [camera, gl])

  // Helper to adjust Y position
  const adjustY = useCallback((delta: number) => {
    if (!groupRef.current) return
    const newY = Math.max(0.5, Math.min(10, groupRef.current.position.y + delta))
    groupRef.current.position.y = newY
    setCurrentY(newY)
    dragPlane.current.constant = -newY
  }, [])

  // Handle scroll wheel for Y-axis movement during drag
  useEffect(() => {
    if (!isDraggingLocal) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      adjustY(-e.deltaY * 0.005) // Invert for natural feel
    }

    gl.domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => gl.domElement.removeEventListener('wheel', handleWheel)
  }, [isDraggingLocal, gl, adjustY])

  // Handle keyboard for Y-axis movement during drag (R = up, F = down)
  useEffect(() => {
    if (!isDraggingLocal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        adjustY(0.2) // Move up
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        adjustY(-0.2) // Move down
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDraggingLocal, adjustY])

  // Handle pointer up anywhere (for when mouse is released outside the node)
  useEffect(() => {
    if (!isDraggingLocal) return

    const handleGlobalPointerUp = async () => {
      if (!groupRef.current || !node.placement) return

      // Get final position
      const finalPosition = {
        x: groupRef.current.position.x,
        y: currentY ?? position[1],
        z: groupRef.current.position.z,
      }

      // Check if dropped on a bucket
      const droppedOnBucket = checkNearbyBucket(finalPosition.x, finalPosition.z)

      setIsDraggingLocal(false)
      setDragging(false)
      setCurrentY(null)
      setNearbyBucket(null)
      gl.domElement.style.cursor = 'auto'

      // If dropped on a bucket, add node to that bucket
      if (droppedOnBucket) {
        console.log(`Dropping node ${node.id} into bucket ${droppedOnBucket.name}`)
        await addNodeToBucket(droppedOnBucket.id, node.id)
        // Optionally move node to bucket location
        finalPosition.x = droppedOnBucket.position_x + (Math.random() - 0.5) * 2
        finalPosition.z = droppedOnBucket.position_z + (Math.random() - 0.5) * 2
      }

      // Update store
      updateNode(node.id, {
        placement: {
          ...node.placement,
          position_x: finalPosition.x,
          position_y: finalPosition.y,
          position_z: finalPosition.z,
        },
      })

      // Save to database
      try {
        const response = await fetch(`/api/placements/${node.placement.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position_x: finalPosition.x,
            position_y: finalPosition.y,
            position_z: finalPosition.z,
          }),
        })

        if (!response.ok) {
          console.error('Failed to save position')
        }
      } catch (error) {
        console.error('Error saving position:', error)
      }
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [isDraggingLocal, node.id, node.placement, position, currentY, updateNode, setDragging, gl, checkNearbyBucket, addNodeToBucket])

  // Start drag
  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isEditMode || !node.placement) return

    // Prevent event from bubbling to canvas/controls
    event.stopPropagation()

    const e = event.nativeEvent

    // Set drag plane at node's current Y height
    dragPlane.current.constant = -position[1]
    setCurrentY(position[1])

    // Calculate offset from click point to node center
    const clickPos = getWorldPosition(e.clientX, e.clientY)
    if (groupRef.current) {
      setDragOffset(new THREE.Vector3(
        groupRef.current.position.x - clickPos.x,
        0,
        groupRef.current.position.z - clickPos.z
      ))
    }

    setIsDraggingLocal(true)
    setDragging(true)

    // Change cursor
    gl.domElement.style.cursor = 'grabbing'

    // Capture pointer
    gl.domElement.setPointerCapture(e.pointerId)
  }, [isEditMode, node.placement, position, getWorldPosition, setDragging, gl])

  // During drag
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingLocal || !groupRef.current) return

    event.stopPropagation()
    const e = event.nativeEvent

    const worldPos = getWorldPosition(e.clientX, e.clientY)

    // Apply offset and update position
    const newX = worldPos.x + dragOffset.x
    const newZ = worldPos.z + dragOffset.z

    // Update visual position immediately
    groupRef.current.position.x = newX
    groupRef.current.position.z = newZ

    // Check if near a bucket for visual feedback
    const nearby = checkNearbyBucket(newX, newZ)
    setNearbyBucket(nearby)
  }, [isDraggingLocal, getWorldPosition, dragOffset, checkNearbyBucket])

  // End drag - just stop propagation, global handler does the actual work
  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingLocal) return
    event.stopPropagation()
    // The global pointerup listener handles saving
  }, [isDraggingLocal])

  // Cancel drag on pointer leave (edge case)
  const handlePointerCancel = useCallback(() => {
    if (isDraggingLocal) {
      setIsDraggingLocal(false)
      setDragging(false)
      setCurrentY(null)
      setNearbyBucket(null)
      gl.domElement.style.cursor = 'auto'
    }
  }, [isDraggingLocal, setDragging, gl])

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Visual feedback during drag */}
      {isDraggingLocal && (
        (() => {
          const y = currentY ?? position[1]
          return (
            <>
              {/* Drop shadow */}
              <mesh position={[0, -y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.3} />
              </mesh>
              {/* Elevation indicator line */}
              <mesh position={[0, -y / 2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, y, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
              </mesh>
              {/* Height label */}
              <Html position={[0.8, -y / 2, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Y: {y.toFixed(1)}m
                </div>
              </Html>
              {/* Bucket drop indicator */}
              {nearbyBucket && (
                <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
                  <div
                    className="text-white text-sm px-3 py-1.5 rounded-full font-medium animate-pulse"
                    style={{ backgroundColor: nearbyBucket.color }}
                  >
                    Drop into &ldquo;{nearbyBucket.name}&rdquo;
                  </div>
                </Html>
              )}
            </>
          )
        })()
      )}

      {/* The actual node - pass dragging state for visual feedback */}
      <group scale={isDraggingLocal ? 1.05 : 1}>
        <NodeObject node={node} />
      </group>

      {/* Edit mode indicator - subtle grab cursor zone */}
      {isEditMode && !isDraggingLocal && (
        <mesh visible={false}>
          <boxGeometry args={[2.5, 2.5, 0.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}
