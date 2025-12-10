import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAILY_API_URL = 'https://api.daily.co/v1'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user's active stream
    const { data: stream, error: findError } = await supabase
      .from('streams')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'live')
      .single()

    if (findError || !stream) {
      return NextResponse.json(
        { error: 'No active stream found' },
        { status: 404 }
      )
    }

    const dailyApiKey = process.env.DAILY_API_KEY

    // Delete Daily.co room (optional - rooms auto-expire)
    if (dailyApiKey) {
      try {
        await fetch(`${DAILY_API_URL}/rooms/${stream.room_name}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${dailyApiKey}` },
        })
      } catch (e) {
        // Log but don't fail if room deletion fails
        console.warn('Failed to delete Daily room:', e)
      }
    }

    // Update stream status in database
    const { data: updatedStream, error: updateError } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', stream.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to end stream' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stream: updatedStream })
  } catch (error) {
    console.error('Error ending stream:', error)
    return NextResponse.json(
      { error: 'Failed to end stream' },
      { status: 500 }
    )
  }
}
