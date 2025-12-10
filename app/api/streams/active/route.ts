import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all active streams with creator info
    const { data: streams, error } = await supabase
      .from('streams')
      .select(`
        *,
        creator:users!creator_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'live')
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch streams' },
        { status: 500 }
      )
    }

    return NextResponse.json({ streams: streams || [] })
  } catch (error) {
    console.error('Error fetching active streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    )
  }
}
