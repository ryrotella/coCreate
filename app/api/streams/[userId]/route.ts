import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    // Get user's active stream with creator info
    const { data: stream, error } = await supabase
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
      .eq('creator_id', userId)
      .eq('status', 'live')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stream' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stream: stream || null })
  } catch (error) {
    console.error('Error fetching user stream:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 500 }
    )
  }
}
