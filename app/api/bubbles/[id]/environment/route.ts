import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/bubbles/[id]/environment - Update bubble environment settings
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const environment = await request.json()

    // Update the bubble environment
    const { data: bubble, error } = await supabase
      .from('bubble_worlds')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .update({
        environment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bubble })
  } catch (error) {
    console.error('Error updating environment:', error)
    return NextResponse.json(
      { error: 'Failed to update environment' },
      { status: 500 }
    )
  }
}
