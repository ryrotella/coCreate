'use client'

import { useBubbleStore } from '@/stores/bubbleStore'
import BucketObject from './BucketObject'

export default function BucketsContainer() {
  const { buckets, toggleBucketExpand } = useBubbleStore()

  const handleToggleExpand = async (bucketId: string) => {
    toggleBucketExpand(bucketId)

    // Persist expansion state to database
    const bucket = buckets.find((b) => b.id === bucketId)
    if (!bucket) return

    try {
      await fetch(`/api/buckets/${bucketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_expanded: !bucket.is_expanded }),
      })
    } catch (error) {
      console.error('Error updating bucket expansion:', error)
    }
  }

  return (
    <group name="buckets-container">
      {buckets.map((bucket) => (
        <BucketObject
          key={bucket.id}
          bucket={bucket}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </group>
  )
}
