import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/placements/[id] - Update a node placement
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const body = await request.json()

    const { position_x, position_y, position_z, scale, rotation_y } = body

    // Update the placement
    const { data: placement, error } = await supabase
      .from('node_placements')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .update({
        position_x,
        position_y,
        position_z,
        scale,
        rotation_y,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ placement })
  } catch (error) {
    console.error('Error updating placement:', error)
    return NextResponse.json(
      { error: 'Failed to update placement' },
      { status: 500 }
    )
  }
}
