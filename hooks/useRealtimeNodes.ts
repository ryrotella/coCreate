import { useEffect, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useBubbleStore } from '@/stores/bubbleStore'
import { NodeWithPlacement, NodePlacement, Node } from '@/types'

interface UseRealtimeNodesOptions {
  // The bubble world ID to listen for changes in
  bubbleWorldId: string | null
  // Whether to enable real-time updates
  enabled?: boolean
}

export function useRealtimeNodes({ bubbleWorldId, enabled = true }: UseRealtimeNodesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const { nodes, addNode, updateNode, removeNode, setNodes } = useBubbleStore()

  useEffect(() => {
    if (!enabled || !bubbleWorldId) {
      return
    }

    const supabase = supabaseRef.current
    const channelName = `nodes:${bubbleWorldId}`

    // Create channel for real-time updates
    const channel = supabase.channel(channelName)

    // Listen for node placement changes (position updates)
    channel.on<NodePlacement>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'node_placements',
        filter: `bubble_world_id=eq.${bubbleWorldId}`,
      },
      async (payload: RealtimePostgresChangesPayload<NodePlacement>) => {
        console.log('Node placement change:', payload.eventType, payload)

        if (payload.eventType === 'UPDATE') {
          const newPlacement = payload.new as NodePlacement
          // Find the node with this placement and update it
          const existingNode = nodes.find((n) => n.placement?.id === newPlacement.id)
          if (existingNode) {
            updateNode(existingNode.id, {
              placement: newPlacement,
            })
          }
        } else if (payload.eventType === 'INSERT') {
          // New placement - fetch the full node data
          const newPlacement = payload.new as NodePlacement
          try {
            const { data: node } = await supabase
              .from('nodes')
              .select('*')
              .eq('id', newPlacement.node_id)
              .single()

            if (node) {
              // Check if node already exists (might have been added locally)
              const existingNode = nodes.find((n) => n.id === node.id)
              if (!existingNode) {
                addNode({
                  ...node,
                  placement: newPlacement,
                } as NodeWithPlacement)
              }
            }
          } catch (err) {
            console.error('Failed to fetch node for new placement:', err)
          }
        } else if (payload.eventType === 'DELETE') {
          const oldPlacement = payload.old as NodePlacement
          // Find and remove the node with this placement
          const existingNode = nodes.find((n) => n.placement?.id === oldPlacement.id)
          if (existingNode) {
            removeNode(existingNode.id)
          }
        }
      }
    )

    // Listen for node changes (content updates)
    channel.on<Node>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'nodes',
      },
      (payload: RealtimePostgresChangesPayload<Node>) => {
        console.log('Node content change:', payload)

        if (payload.eventType === 'UPDATE') {
          const updatedNode = payload.new as Node
          // Check if this node is in our current bubble
          const existingNode = nodes.find((n) => n.id === updatedNode.id)
          if (existingNode) {
            updateNode(updatedNode.id, {
              ...updatedNode,
              placement: existingNode.placement, // Keep existing placement
            })
          }
        }
      }
    )

    // Listen for node deletions
    channel.on<Node>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'nodes',
      },
      (payload: RealtimePostgresChangesPayload<Node>) => {
        console.log('Node deleted:', payload)
        const deletedNode = payload.old as Node
        removeNode(deletedNode.id)
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Real-time nodes subscribed for bubble: ${bubbleWorldId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to node changes')
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [bubbleWorldId, enabled, nodes, addNode, updateNode, removeNode])

  return null
}
