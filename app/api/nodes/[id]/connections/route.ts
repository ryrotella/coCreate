import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/nodes/[id]/connections - Fetch all connections for a node (who added it to their collections)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id: nodeId } = await params

    // Fetch all bucket_nodes entries for this node (who added it to which bucket)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucketConnections, error: bucketError } = await (supabase as any)
      .from('bucket_nodes')
      .select(`
        id,
        added_at,
        bucket:buckets(
          id,
          name,
          color,
          bubble_world_id
        ),
        added_by:users!bucket_nodes_added_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('node_id', nodeId)
      .order('added_at', { ascending: false })

    if (bucketError) {
      console.error('Error fetching bucket connections:', bucketError)
      return NextResponse.json({ error: bucketError.message }, { status: 500 })
    }

    // Fetch all saved_nodes entries for this node (who saved it to their collection)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedConnections, error: savedError } = await (supabase as any)
      .from('saved_nodes')
      .select(`
        id,
        created_at,
        bucket:buckets(
          id,
          name,
          color,
          bubble_world_id
        ),
        user:users!saved_nodes_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })

    if (savedError) {
      console.error('Error fetching saved connections:', savedError)
      return NextResponse.json({ error: savedError.message }, { status: 500 })
    }

    // Combine and deduplicate connections
    const connectionMap = new Map<string, {
      id: string
      user: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
      }
      bucket: {
        id: string
        name: string
        color: string
        bubble_world_id: string
      } | null
      added_at: string
    }>()

    // Add bucket connections
    for (const conn of bucketConnections || []) {
      const key = `${conn.added_by.id}-${conn.bucket?.id || 'none'}`
      if (!connectionMap.has(key)) {
        connectionMap.set(key, {
          id: conn.id,
          user: conn.added_by,
          bucket: conn.bucket,
          added_at: conn.added_at,
        })
      }
    }

    // Add saved connections (only if not already in a bucket by same user)
    for (const conn of savedConnections || []) {
      const key = `${conn.user.id}-${conn.bucket?.id || 'none'}`
      if (!connectionMap.has(key)) {
        connectionMap.set(key, {
          id: conn.id,
          user: conn.user,
          bucket: conn.bucket,
          added_at: conn.created_at,
        })
      }
    }

    // Convert to array and sort by date
    const connections = Array.from(connectionMap.values()).sort(
      (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    )

    return NextResponse.json({
      connections,
      connection_count: connections.length,
    })
  } catch (error) {
    console.error('Error in GET node connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch node connections' },
      { status: 500 }
    )
  }
}
