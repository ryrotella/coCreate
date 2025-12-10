import { create } from 'zustand'
import {
  BubbleWorld,
  BubbleEnvironment,
  NodeWithPlacement,
  User,
  BucketWithNodes,
} from '@/types'

interface BubbleState {
  // Current bubble being viewed
  currentBubble: BubbleWorld | null
  currentBubbleOwner: User | null
  nodes: NodeWithPlacement[]
  buckets: BucketWithNodes[]

  // Environment settings
  environment: BubbleEnvironment

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  setBubble: (bubble: BubbleWorld, owner: User) => void
  setNodes: (nodes: NodeWithPlacement[]) => void
  addNode: (node: NodeWithPlacement) => void
  updateNode: (nodeId: string, updates: Partial<NodeWithPlacement>) => void
  removeNode: (nodeId: string) => void
  setBuckets: (buckets: BucketWithNodes[]) => void
  addBucket: (bucket: BucketWithNodes) => void
  updateBucket: (bucketId: string, updates: Partial<BucketWithNodes>) => void
  removeBucket: (bucketId: string) => void
  toggleBucketExpand: (bucketId: string) => void
  addNodeToBucket: (bucketId: string, nodeId: string) => Promise<void>
  removeNodeFromBucket: (bucketId: string, nodeId: string) => Promise<void>
  updateEnvironment: (env: Partial<BubbleEnvironment>) => void
  saveEnvironment: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const defaultEnvironment: BubbleEnvironment = {
  skyColor: '#ffffff',
  groundColor: '#e0e0e0',
  fogColor: '#f5f5f5',
  fogDensity: 0.01,
  lightIntensity: 1.2,
}

export const useBubbleStore = create<BubbleState>((set) => ({
  currentBubble: null,
  currentBubbleOwner: null,
  nodes: [],
  buckets: [],
  environment: defaultEnvironment,
  isLoading: false,
  error: null,

  setBubble: (bubble, owner) => {
    const env = bubble.environment as unknown as BubbleEnvironment
    set({
      currentBubble: bubble,
      currentBubbleOwner: owner,
      environment: env || defaultEnvironment,
    })
  },

  setNodes: (nodes) => set({ nodes }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
    })),

  setBuckets: (buckets) => set({ buckets }),

  addBucket: (bucket) =>
    set((state) => ({
      buckets: [...state.buckets, bucket],
    })),

  updateBucket: (bucketId, updates) =>
    set((state) => ({
      buckets: state.buckets.map((bucket) =>
        bucket.id === bucketId ? { ...bucket, ...updates } : bucket
      ),
    })),

  removeBucket: (bucketId) =>
    set((state) => ({
      buckets: state.buckets.filter((bucket) => bucket.id !== bucketId),
    })),

  toggleBucketExpand: (bucketId) =>
    set((state) => ({
      buckets: state.buckets.map((bucket) =>
        bucket.id === bucketId
          ? { ...bucket, is_expanded: !bucket.is_expanded }
          : bucket
      ),
    })),

  addNodeToBucket: async (bucketId, nodeId) => {
    try {
      const response = await fetch(`/api/buckets/${bucketId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId }),
      })

      if (!response.ok) {
        console.error('Failed to add node to bucket')
        return
      }

      const { bucketNode } = await response.json()

      // Update bucket in store
      set((state) => ({
        buckets: state.buckets.map((bucket) =>
          bucket.id === bucketId
            ? { ...bucket, nodes: [...(bucket.nodes || []), bucketNode] }
            : bucket
        ),
      }))
    } catch (error) {
      console.error('Error adding node to bucket:', error)
    }
  },

  removeNodeFromBucket: async (bucketId, nodeId) => {
    try {
      const response = await fetch(`/api/buckets/${bucketId}/nodes?nodeId=${nodeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        console.error('Failed to remove node from bucket')
        return
      }

      // Update bucket in store
      set((state) => ({
        buckets: state.buckets.map((bucket) =>
          bucket.id === bucketId
            ? {
                ...bucket,
                nodes: (bucket.nodes || []).filter((bn) => bn.node_id !== nodeId),
              }
            : bucket
        ),
      }))
    } catch (error) {
      console.error('Error removing node from bucket:', error)
    }
  },

  updateEnvironment: (env) =>
    set((state) => ({
      environment: { ...state.environment, ...env },
    })),

  saveEnvironment: async () => {
    const state = useBubbleStore.getState()
    if (!state.currentBubble?.id) {
      console.error('No bubble to save environment to')
      return
    }

    try {
      const response = await fetch(
        `/api/bubbles/${state.currentBubble.id}/environment`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.environment),
        }
      )

      if (!response.ok) {
        console.error('Failed to save environment')
      }
    } catch (error) {
      console.error('Error saving environment:', error)
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentBubble: null,
      currentBubbleOwner: null,
      nodes: [],
      buckets: [],
      environment: defaultEnvironment,
      isLoading: false,
      error: null,
    }),
}))
