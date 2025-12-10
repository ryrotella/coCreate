import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateRandomPosition } from '@/lib/placement'
import { NextResponse } from 'next/server'

// GET /api/saved-nodes - Fetch saved nodes for authenticated user
export async function GET() {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch saved nodes with their full node data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedNodes, error } = await (supabase as any)
      .from('saved_nodes')
      .select(`
        id,
        created_at,
        node:nodes(
          id,
          creator_id,
          type,
          title,
          description,
          content_type,
          content_data,
          tags,
          created_at
        ),
        original_creator:users!saved_nodes_original_creator_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved nodes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ savedNodes })
  } catch (error) {
    console.error('Error in GET saved-nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved nodes' },
      { status: 500 }
    )
  }
}

// POST /api/saved-nodes - Save a node to your collection
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nodeId, placeInWorld } = body

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 }
      )
    }

    // Get the original node to verify it exists and get creator_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: originalNode, error: nodeError } = await (supabase as any)
      .from('nodes')
      .select('id, creator_id, type')
      .eq('id', nodeId)
      .single()

    if (nodeError || !originalNode) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Can't save your own node
    if (originalNode.creator_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot save your own nodes' },
        { status: 400 }
      )
    }

    // Check if already saved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('saved_nodes')
      .select('id')
      .eq('user_id', user.id)
      .eq('node_id', nodeId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Node already saved' },
        { status: 400 }
      )
    }

    // Save the node reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedNode, error: saveError } = await (supabase as any)
      .from('saved_nodes')
      .insert({
        user_id: user.id,
        node_id: nodeId,
        original_creator_id: originalNode.creator_id,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving node:', saveError)
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    // Optionally place the node in the user's world
    let placement = null
    if (placeInWorld) {
      // Get user's bubble world
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bubbleWorld } = await (supabase as any)
        .from('bubble_worlds')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (bubbleWorld) {
        const position = generateRandomPosition()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newPlacement } = await (supabase as any)
          .from('node_placements')
          .insert({
            node_id: nodeId,
            bubble_world_id: bubbleWorld.id,
            position_x: position.x,
            position_y: position.y,
            position_z: position.z,
            scale: 1.0,
            rotation_y: 0,
            display_style: originalNode.type === 'image' ? 'frame' : 'card',
          })
          .select()
          .single()

        placement = newPlacement
      }
    }

    return NextResponse.json({ savedNode, placement }, { status: 201 })
  } catch (error) {
    console.error('Error in POST saved-nodes:', error)
    return NextResponse.json(
      { error: 'Failed to save node' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-nodes - Unsave a node
export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('saved_nodes')
      .delete()
      .eq('user_id', user.id)
      .eq('node_id', nodeId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE saved-nodes:', error)
    return NextResponse.json(
      { error: 'Failed to unsave node' },
      { status: 500 }
    )
  }
}
