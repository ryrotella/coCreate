import { Position3D } from '@/types'

/**
 * Generate a random position within the bubble
 * Creates positions in a spherical distribution within a safe zone
 */
export function generateRandomPosition(): Position3D {
  // Generate position in a sphere
  const radius = 8 + Math.random() * 8 // Between 8-16 units from center
  const theta = Math.random() * Math.PI * 2 // Horizontal angle
  const phi = Math.random() * Math.PI // Vertical angle

  // Convert spherical to Cartesian coordinates
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta) + 2 // Offset up slightly
  const z = radius * Math.cos(phi)

  return { x, y, z }
}

/**
 * Generate a position in a specific layout pattern
 */
export function generateLayoutPosition(
  index: number,
  total: number,
  layoutType: 'circle' | 'spiral' | 'grid' | 'random' = 'circle'
): Position3D {
  switch (layoutType) {
    case 'circle': {
      const radius = 10
      const angle = (index / total) * Math.PI * 2
      return {
        x: Math.cos(angle) * radius,
        y: 2 + Math.sin(index * 0.5) * 2, // Vary height
        z: Math.sin(angle) * radius,
      }
    }

    case 'spiral': {
      const angle = index * 0.5
      const radius = 5 + index * 0.3
      return {
        x: Math.cos(angle) * radius,
        y: index * 0.5,
        z: Math.sin(angle) * radius,
      }
    }

    case 'grid': {
      const cols = Math.ceil(Math.sqrt(total))
      const row = Math.floor(index / cols)
      const col = index % cols
      return {
        x: (col - cols / 2) * 3,
        y: 2,
        z: (row - cols / 2) * 3,
      }
    }

    case 'random':
    default:
      return generateRandomPosition()
  }
}
