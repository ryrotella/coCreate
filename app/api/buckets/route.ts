import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/buckets - Fetch buckets for a bubble world
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const bubbleWorldId = searchParams.get('bubbleWorldId')

    if (!bubbleWorldId) {
      return NextResponse.json(
        { error: 'bubbleWorldId is required' },
        { status: 400 }
      )
    }

    // Fetch buckets with their nodes and user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: buckets, error } = await (supabase as any)
      .from('buckets')
      .select(`
        *,
        bucket_nodes(
          id,
          node_id,
          added_by_id,
          position_x,
          position_y,
          position_z,
          added_at,
          node:nodes(*),
          added_by:users!bucket_nodes_added_by_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('bubble_world_id', bubbleWorldId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching buckets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ buckets })
  } catch (error) {
    console.error('Error in GET buckets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buckets' },
      { status: 500 }
    )
  }
}

// POST /api/buckets - Create a new bucket
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
    const { name, description, color, position_x, position_y, position_z } = body

    // Get user's bubble world
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bubbleWorld, error: bubbleError } = await (supabase as any)
      .from('bubble_worlds')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (bubbleError || !bubbleWorld) {
      return NextResponse.json(
        { error: 'No bubble world found for user' },
        { status: 400 }
      )
    }

    // Create the bucket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucket, error: bucketError } = await (supabase as any)
      .from('buckets')
      .insert({
        bubble_world_id: bubbleWorld.id,
        creator_id: user.id,
        name: name || 'New Bucket',
        description,
        color: color || '#6366f1',
        position_x: position_x ?? 0,
        position_y: position_y ?? 1,
        position_z: position_z ?? 0,
      })
      .select()
      .single()

    if (bucketError) {
      console.error('Error creating bucket:', bucketError)
      return NextResponse.json({ error: bucketError.message }, { status: 500 })
    }

    return NextResponse.json({ bucket }, { status: 201 })
  } catch (error) {
    console.error('Error in POST buckets:', error)
    return NextResponse.json(
      { error: 'Failed to create bucket' },
      { status: 500 }
    )
  }
}
