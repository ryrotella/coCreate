'use client'

import { useWASDControls } from '@/hooks/useWASDControls'

interface WASDControlsProps {
  moveSpeed?: number
  enabled?: boolean
}

export default function WASDControls({ moveSpeed = 0.3, enabled = true }: WASDControlsProps) {
  useWASDControls({ moveSpeed, enabled })
  return null
}
