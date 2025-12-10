'use client'

import { useBubbleStore } from '@/stores/bubbleStore'
import DraggableNode from './DraggableNode'

export default function NodesContainer() {
  const { nodes } = useBubbleStore()

  return (
    <group name="nodes-container">
      {nodes.map((node) => (
        <DraggableNode key={node.id} node={node} />
      ))}
    </group>
  )
}
