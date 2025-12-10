import { useEffect, useState } from 'react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { NodeWithPlacement, BubbleWorld, User, BucketWithNodes } from '@/types'

export function useBubbleData(userId?: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setBubble, setNodes, setBuckets, setLoading, setError: setStoreError, currentBubble } = useBubbleStore()

  useEffect(() => {
    async function loadBubbleData() {
      try {
        setIsLoading(true)
        setLoading(true)
        setError(null)

        // Fetch bubble world with environment settings
        const bubbleResponse = await fetch(
          userId ? `/api/bubbles?userId=${userId}` : '/api/bubbles'
        )

        let bubbleWorldId: string | null = null
        if (bubbleResponse.ok) {
          const { bubble, owner } = await bubbleResponse.json()
          if (bubble && owner) {
            setBubble(bubble, owner)
            bubbleWorldId = bubble.id
          }
        }

        // Fetch nodes with placements
        const nodesResponse = await fetch(
          userId ? `/api/nodes?userId=${userId}` : '/api/nodes'
        )

        if (!nodesResponse.ok) {
          throw new Error('Failed to fetch nodes')
        }

        const { nodes } = await nodesResponse.json()

        // Transform the data - handle both single placement and array of placements
        const transformedNodes: NodeWithPlacement[] = nodes.map((node: any) => {
          // node.placement might be an array from the query
          const placement = Array.isArray(node.placement)
            ? node.placement[0]
            : node.placement

          return {
            ...node,
            placement: placement || undefined,
          }
        })

        // Set nodes in store
        setNodes(transformedNodes)

        console.log(`Loaded ${transformedNodes.length} nodes`)

        // Fetch buckets for this bubble world
        if (bubbleWorldId) {
          const bucketsResponse = await fetch(`/api/buckets?bubbleWorldId=${bubbleWorldId}`)
          if (bucketsResponse.ok) {
            const { buckets } = await bucketsResponse.json()
            // Transform bucket_nodes array format
            const transformedBuckets: BucketWithNodes[] = (buckets || []).map((bucket: any) => ({
              ...bucket,
              nodes: bucket.bucket_nodes || [],
            }))
            setBuckets(transformedBuckets)
            console.log(`Loaded ${transformedBuckets.length} buckets`)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bubble data'
        setError(errorMessage)
        setStoreError(errorMessage)
        console.error('Error loading bubble data:', err)
      } finally {
        setIsLoading(false)
        setLoading(false)
      }
    }

    loadBubbleData()
  }, [userId, setBubble, setNodes, setBuckets, setLoading, setStoreError])

  return { isLoading, error }
}
