import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/bubbles/place-node - Place a node in a bubble world
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      node_id,
      bubble_world_id,
      position_x,
      position_y,
      position_z,
      scale,
      rotation_y,
      display_style,
    } = body

    if (!node_id || !bubble_world_id) {
      return NextResponse.json(
        { error: 'node_id and bubble_world_id are required' },
        { status: 400 }
      )
    }

    // Check if placement already exists
    const { data: existing } = await supabase
      .from('node_placements')
      .select('id')
      .eq('node_id', node_id)
      .eq('bubble_world_id', bubble_world_id)
      .single()

    if (existing) {
      // Update existing placement
      const { data: placement, error } = await supabase
        .from('node_placements')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .update({
          position_x: position_x ?? 0,
          position_y: position_y ?? 1.5,
          position_z: position_z ?? 0,
          scale: scale ?? 1.0,
          rotation_y: rotation_y ?? 0,
          display_style: display_style ?? 'card',
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ placement })
    }

    // Create new placement
    const { data: placement, error } = await supabase
      .from('node_placements')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .insert({
        node_id,
        bubble_world_id,
        position_x: position_x ?? 0,
        position_y: position_y ?? 1.5,
        position_z: position_z ?? 0,
        scale: scale ?? 1.0,
        rotation_y: rotation_y ?? 0,
        display_style: display_style ?? 'card',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ placement }, { status: 201 })
  } catch (error) {
    console.error('Error placing node:', error)
    return NextResponse.json(
      { error: 'Failed to place node' },
      { status: 500 }
    )
  }
}
