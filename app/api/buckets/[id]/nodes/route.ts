import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/buckets/[id]/nodes - Add a node to a bucket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { id: bucketId } = await params

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nodeId, position_x, position_y, position_z } = body

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 }
      )
    }

    // Verify bucket exists and user owns it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucket, error: bucketError } = await (supabase as any)
      .from('buckets')
      .select('id, creator_id')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      )
    }

    if (bucket.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to add nodes to this bucket' },
        { status: 403 }
      )
    }

    // Verify node exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: node, error: nodeError } = await (supabase as any)
      .from('nodes')
      .select('id')
      .eq('id', nodeId)
      .single()

    if (nodeError || !node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Check if node is already in bucket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('bucket_nodes')
      .select('id')
      .eq('bucket_id', bucketId)
      .eq('node_id', nodeId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Node is already in this bucket' },
        { status: 400 }
      )
    }

    // Add node to bucket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucketNode, error: insertError } = await (supabase as any)
      .from('bucket_nodes')
      .insert({
        bucket_id: bucketId,
        node_id: nodeId,
        added_by_id: user.id,
        position_x: position_x ?? 0,
        position_y: position_y ?? 0,
        position_z: position_z ?? 0,
      })
      .select(`
        *,
        node:nodes(*),
        added_by:users!bucket_nodes_added_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error adding node to bucket:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ bucketNode }, { status: 201 })
  } catch (error) {
    console.error('Error in POST bucket nodes:', error)
    return NextResponse.json(
      { error: 'Failed to add node to bucket' },
      { status: 500 }
    )
  }
}

// DELETE /api/buckets/[id]/nodes - Remove a node from a bucket
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { id: bucketId } = await params

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('nodeId')

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 }
      )
    }

    // Verify bucket exists and user owns it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucket, error: bucketError } = await (supabase as any)
      .from('buckets')
      .select('id, creator_id')
      .eq('id', bucketId)
      .single()

    if (bucketError || !bucket) {
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      )
    }

    if (bucket.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to remove nodes from this bucket' },
        { status: 403 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bucket_nodes')
      .delete()
      .eq('bucket_id', bucketId)
      .eq('node_id', nodeId)

    if (error) {
      console.error('Error removing node from bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE bucket nodes:', error)
    return NextResponse.json(
      { error: 'Failed to remove node from bucket' },
      { status: 500 }
    )
  }
}
