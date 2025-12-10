'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUIStore } from '@/stores/uiStore'

interface WorldControlsProps {
  baseSpeed?: number
  boostMultiplier?: number
  rotationSpeed?: number
  smoothing?: number
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

interface MouseState {
  isRightDown: boolean
  isLeftDown: boolean
  lastX: number
  lastY: number
}

export default function WorldControls({
  baseSpeed = 0.6,
  boostMultiplier = 2.5,
  rotationSpeed = 0.003,
  smoothing = 0.12,
  enabled = true,
}: WorldControlsProps) {
  const { camera, gl } = useThree()
  const controlMode = useUIStore((state) => state.controlMode)
  const isDragging = useUIStore((state) => state.isDragging)

  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
  })

  const mouse = useRef<MouseState>({
    isRightDown: false,
    isLeftDown: false,
    lastX: 0,
    lastY: 0,
  })

  // Smooth velocity for momentum feel
  const currentVelocity = useRef(new THREE.Vector3())
  const targetVelocity = useRef(new THREE.Vector3())

  // Camera rotation (for fly mode)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  // Initialize euler from camera
  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ')
  }, [camera])

  // Keyboard handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
        event.preventDefault()
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

  // Mouse handlers
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 2) {
      mouse.current.isRightDown = true
      mouse.current.lastX = event.clientX
      mouse.current.lastY = event.clientY
    } else if (event.button === 0) {
      mouse.current.isLeftDown = true
      mouse.current.lastX = event.clientX
      mouse.current.lastY = event.clientY
    }
  }, [])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (event.button === 2) {
      mouse.current.isRightDown = false
    } else if (event.button === 0) {
      mouse.current.isLeftDown = false
    }
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Skip camera rotation if dragging a node
    if (isDragging) return

    const m = mouse.current

    // Editor mode: right-click drag rotates
    // Fly mode: left-click drag rotates (or any drag)
    const shouldRotate =
      (controlMode === 'editor' && m.isRightDown) ||
      (controlMode === 'fly' && (m.isLeftDown || m.isRightDown))

    if (shouldRotate) {
      const deltaX = event.clientX - m.lastX
      const deltaY = event.clientY - m.lastY

      // Update euler angles
      euler.current.y -= deltaX * rotationSpeed
      euler.current.x -= deltaY * rotationSpeed

      // Clamp vertical rotation
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x))

      // Apply rotation to camera
      camera.quaternion.setFromEuler(euler.current)
    }

    m.lastX = event.clientX
    m.lastY = event.clientY
  }, [camera, controlMode, rotationSpeed, isDragging])

  // Wheel handler for zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    // Skip zoom if dragging a node
    if (isDragging) return

    event.preventDefault()

    const zoomSpeed = 0.5
    const delta = event.deltaY * zoomSpeed

    // Move camera forward/backward along its look direction
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)

    camera.position.addScaledVector(direction, -delta * 0.1)

    // Prevent going below ground
    if (camera.position.y < 5) {
      camera.position.y = 5
    }
  }, [camera, isDragging])

  // Prevent context menu on right-click
  const handleContextMenu = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const canvas = gl.domElement

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [enabled, gl, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleWheel, handleContextMenu])

  useFrame(() => {
    // Skip camera movement if disabled or dragging a node
    if (!enabled || isDragging) return

    const k = keys.current
    const speed = k.shift ? baseSpeed * boostMultiplier : baseSpeed

    targetVelocity.current.set(0, 0, 0)

    if (controlMode === 'editor') {
      // Editor mode: WASD pans in world XZ plane
      if (k.forward) targetVelocity.current.z -= speed
      if (k.backward) targetVelocity.current.z += speed
      if (k.left) targetVelocity.current.x -= speed
      if (k.right) targetVelocity.current.x += speed
    } else {
      // Fly mode: WASD moves relative to camera direction
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)

      // Horizontal forward (project to XZ plane)
      const horizontalForward = new THREE.Vector3(forward.x, 0, forward.z).normalize()

      // Handle straight-down camera view
      if (horizontalForward.lengthSq() < 0.001) {
        horizontalForward.set(0, 0, -1)
      }

      // Right vector
      const right = new THREE.Vector3()
      right.crossVectors(horizontalForward, new THREE.Vector3(0, 1, 0)).normalize()

      if (k.forward) {
        targetVelocity.current.add(horizontalForward.clone().multiplyScalar(speed))
      }
      if (k.backward) {
        targetVelocity.current.add(horizontalForward.clone().multiplyScalar(-speed))
      }
      if (k.left) {
        targetVelocity.current.add(right.clone().multiplyScalar(-speed))
      }
      if (k.right) {
        targetVelocity.current.add(right.clone().multiplyScalar(speed))
      }
    }

    // Vertical movement (same for both modes)
    if (k.up) targetVelocity.current.y += speed
    if (k.down) targetVelocity.current.y -= speed

    // Smooth interpolation
    currentVelocity.current.lerp(targetVelocity.current, smoothing)

    // Apply movement
    if (currentVelocity.current.lengthSq() > 0.0001) {
      camera.position.add(currentVelocity.current)

      // Floor limit
      if (camera.position.y < 5) {
        camera.position.y = 5
      }
    }
  })

  return null
}
