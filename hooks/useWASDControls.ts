'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WASDControlsOptions {
  moveSpeed?: number
  enabled?: boolean
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

export function useWASDControls(options: WASDControlsOptions = {}) {
  const { moveSpeed = 0.3, enabled = true } = options
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

  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

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

  useFrame((_, delta) => {
    if (!enabled) return

    const k = keys.current
    const speed = k.shift ? moveSpeed * 2 : moveSpeed // Shift = faster movement

    // Get camera's forward and right directions (ignoring Y for horizontal movement)
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(forward)

    // For horizontal movement, keep forward direction but project to XZ plane
    const horizontalForward = forward.clone()
    horizontalForward.y = 0
    horizontalForward.normalize()

    // Right vector is perpendicular to forward in XZ plane
    right.crossVectors(new THREE.Vector3(0, 1, 0), horizontalForward).normalize()

    // Reset velocity
    velocity.current.set(0, 0, 0)

    // Forward/Backward
    if (k.forward) {
      velocity.current.add(horizontalForward.multiplyScalar(speed))
    }
    if (k.backward) {
      velocity.current.add(horizontalForward.clone().multiplyScalar(-speed))
    }

    // Left/Right (strafe)
    if (k.left) {
      velocity.current.add(right.clone().multiplyScalar(speed))
    }
    if (k.right) {
      velocity.current.add(right.clone().multiplyScalar(-speed))
    }

    // Up/Down (Q/E or Space/Ctrl)
    if (k.up) {
      velocity.current.y += speed
    }
    if (k.down) {
      velocity.current.y -= speed
    }

    // Apply movement to camera
    if (velocity.current.lengthSq() > 0) {
      camera.position.add(velocity.current)
    }
  })

  return keys.current
}
