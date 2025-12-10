'use client'

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkLink, NetworkNode } from '@/types'

interface ConnectionEdgeProps {
  link: NetworkLink
}

export default function ConnectionEdge({ link }: ConnectionEdgeProps) {
  // Get source and target positions
  const source = link.source as NetworkNode
  const target = link.target as NetworkNode

  // Ground plane Y position (matches beacon base)
  const groundY = -1.8

  // Create curved line points that arc along the ground
  const points = useMemo(() => {
    if (source.x === undefined || target.x === undefined) return []

    const start = new THREE.Vector3(source.x || 0, groundY, source.z || 0)
    const end = new THREE.Vector3(target.x || 0, groundY, target.z || 0)

    // Calculate distance for arc height
    const distance = start.distanceTo(end)

    // Create a slight arc above the ground
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)

    // Arc height proportional to distance (but capped)
    mid.y = groundY + Math.min(distance * 0.15, 3)

    // Create curve
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    return curve.getPoints(24)
  }, [source, target])

  // Color based on connection type
  const color = useMemo(() => {
    switch (link.type) {
      case 'follow':
        return '#8b5cf6' // Purple
      case 'collaboration':
        return '#06b6d4' // Cyan
      case 'inspiration':
        return '#f59e0b' // Amber
      default:
        return '#9ca3af' // Light gray
    }
  }, [link.type])

  if (points.length === 0) return null

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.5}
      dashed
      dashSize={0.5}
      gapSize={0.3}
    />
  )
}
