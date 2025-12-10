import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/buckets/[id] - Fetch a single bucket with its nodes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucket, error } = await (supabase as any)
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    return NextResponse.json({ bucket })
  } catch (error) {
    console.error('Error in GET bucket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bucket' },
      { status: 500 }
    )
  }
}

// PATCH /api/buckets/[id] - Update a bucket
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { id } = await params

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBucket } = await (supabase as any)
      .from('buckets')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!existingBucket || existingBucket.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this bucket' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, position_x, position_y, position_z, scale, is_expanded } = body

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color
    if (position_x !== undefined) updates.position_x = position_x
    if (position_y !== undefined) updates.position_y = position_y
    if (position_z !== undefined) updates.position_z = position_z
    if (scale !== undefined) updates.scale = scale
    if (is_expanded !== undefined) updates.is_expanded = is_expanded

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bucket, error } = await (supabase as any)
      .from('buckets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bucket })
  } catch (error) {
    console.error('Error in PATCH bucket:', error)
    return NextResponse.json(
      { error: 'Failed to update bucket' },
      { status: 500 }
    )
  }
}

// DELETE /api/buckets/[id] - Delete a bucket
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { id } = await params

    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBucket } = await (supabase as any)
      .from('buckets')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!existingBucket || existingBucket.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this bucket' },
        { status: 403 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('buckets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE bucket:', error)
    return NextResponse.json(
      { error: 'Failed to delete bucket' },
      { status: 500 }
    )
  }
}
