import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateRandomPosition } from '@/lib/placement'
import { NextResponse } from 'next/server'

// GET /api/nodes - Fetch nodes placed in a user's bubble world (includes saved nodes from others)
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')

    // Get target user ID - either from query param or authenticated user
    let targetUserId = userIdParam

    if (!targetUserId) {
      const { data: { user } } = await serverClient.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      targetUserId = user.id
    }

    // First, get the user's bubble world ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bubbleWorld, error: bubbleError } = await (supabase as any)
      .from('bubble_worlds')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    if (bubbleError || !bubbleWorld) {
      // Return empty if no bubble world exists yet
      return NextResponse.json({ nodes: [] })
    }

    // Fetch all nodes that have placements in this user's bubble world
    // This includes both their own nodes AND saved nodes from other users
    // Also fetch the creator info for attribution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: placements, error } = await (supabase as any)
      .from('node_placements')
      .select(`
        id,
        node_id,
        bubble_world_id,
        position_x,
        position_y,
        position_z,
        scale,
        rotation_y,
        display_style,
        updated_at,
        node:nodes(
          id,
          creator_id,
          type,
          title,
          description,
          content_type,
          content_data,
          tags,
          created_at,
          updated_at,
          creator:users!nodes_creator_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('bubble_world_id', bubbleWorld.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching nodes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match expected format (node with placement)
    const nodes = (placements || [])
      .filter((p: any) => p.node) // Filter out any orphaned placements
      .map((p: any) => ({
        ...p.node,
        placement: {
          id: p.id,
          node_id: p.node_id,
          bubble_world_id: p.bubble_world_id,
          position_x: p.position_x,
          position_y: p.position_y,
          position_z: p.position_z,
          scale: p.scale,
          rotation_y: p.rotation_y,
          display_style: p.display_style,
          updated_at: p.updated_at,
        },
      }))

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error('Error in GET nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    )
  }
}

// POST /api/nodes - Create a new node
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

    // Get authenticated user
    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    const body = await request.json()
    const { title, description, type, content_type, content_data, tags } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Create the node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: node, error: nodeError } = await (supabase as any)
      .from('nodes')
      .insert({
        creator_id: userId,
        title,
        description,
        type,
        content_type: content_type || type,
        content_data,
        tags: tags || [],
      })
      .select()
      .single()

    if (nodeError) {
      return NextResponse.json({ error: nodeError.message }, { status: 500 })
    }

    // Get user's bubble world
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bubbleWorld } = await (supabase as any)
      .from('bubble_worlds')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!bubbleWorld) {
      return NextResponse.json(
        { error: 'No bubble world found for user' },
        { status: 400 }
      )
    }

    // Auto-generate a random position for the node
    const position = generateRandomPosition()

    // Create placement for the node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: placement, error: placementError } = await (supabase as any)
      .from('node_placements')
      .insert({
        node_id: node.id,
        bubble_world_id: (bubbleWorld as { id: string }).id,
        position_x: position.x,
        position_y: position.y,
        position_z: position.z,
        scale: 1.0,
        rotation_y: 0,
        display_style: type === 'image' ? 'frame' : 'card',
      })
      .select()
      .single()

    if (placementError) {
      console.error('Error creating placement:', placementError)
      // Don't fail the request, just log the error
      // Node was created successfully, placement can be added later
    }

    // Return node with placement
    const nodeWithPlacement = {
      ...node,
      placement: placement || null,
    }

    return NextResponse.json({ node: nodeWithPlacement }, { status: 201 })
  } catch (error) {
    console.error('Error creating node:', error)
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    )
  }
}
