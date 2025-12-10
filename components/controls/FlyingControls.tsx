'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FlyingControlsProps {
  baseSpeed?: number
  boostMultiplier?: number
  enabled?: boolean
  smoothing?: number
}

interface KeyState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  shift: boolean
}

export default function FlyingControls({
  baseSpeed = 0.5,
  boostMultiplier = 2.5,
  enabled = true,
  smoothing = 0.15,
}: FlyingControlsProps) {
  const { camera } = useThree()

  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
  })

  // Smooth velocity for momentum feel
  const currentVelocity = useRef(new THREE.Vector3())
  const targetVelocity = useRef(new THREE.Vector3())

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't capture if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.forward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.current.backward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.current.right = true
        break
      case 'KeyQ':
      case 'Space':
        keys.current.up = true
        event.preventDefault() // Prevent page scroll on space
        break
      case 'KeyE':
      case 'ControlLeft':
      case 'ControlRight':
        keys.current.down = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.current.shift = true
        break
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.current.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.current.right = false
        break
      case 'KeyQ':
      case 'Space':
        keys.current.up = false
        break
      case 'KeyE':
      case 'ControlLeft':
      case 'ControlRight':
        keys.current.down = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.current.shift = false
        break
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled, handleKeyDown, handleKeyUp])

  useFrame(() => {
    if (!enabled) return

    const k = keys.current
    const speed = k.shift ? baseSpeed * boostMultiplier : baseSpeed

    // Get camera's orientation for directional movement
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)

    // Create horizontal forward vector (for map-style movement)
    // Project camera direction onto XZ plane
    const horizontalForward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize()

    // If camera is looking straight down, use a default forward direction
    if (horizontalForward.lengthSq() < 0.001) {
      horizontalForward.set(0, 0, -1)
    }

    // Right vector is perpendicular to forward (in XZ plane)
    const right = new THREE.Vector3()
    right.crossVectors(horizontalForward, new THREE.Vector3(0, 1, 0)).normalize()

    // Calculate target velocity based on input
    targetVelocity.current.set(0, 0, 0)

    // Forward/Backward (W/S) - move in the direction camera is facing (horizontally)
    if (k.forward) {
      targetVelocity.current.add(horizontalForward.clone().multiplyScalar(speed))
    }
    if (k.backward) {
      targetVelocity.current.add(horizontalForward.clone().multiplyScalar(-speed))
    }

    // Left/Right (A/D) - strafe perpendicular to camera direction
    // FIXED: A = left (negative right), D = right (positive right)
    if (k.left) {
      targetVelocity.current.add(right.clone().multiplyScalar(-speed))
    }
    if (k.right) {
      targetVelocity.current.add(right.clone().multiplyScalar(speed))
    }

    // Up/Down (Q/E or Space/Ctrl) - vertical movement
    if (k.up) {
      targetVelocity.current.y += speed
    }
    if (k.down) {
      targetVelocity.current.y -= speed
    }

    // Smooth interpolation for momentum feel
    currentVelocity.current.lerp(targetVelocity.current, smoothing)

    // Apply movement to camera position
    if (currentVelocity.current.lengthSq() > 0.0001) {
      camera.position.add(currentVelocity.current)

      // Prevent going below ground
      if (camera.position.y < 5) {
        camera.position.y = 5
      }
    }
  })

  return null
}
