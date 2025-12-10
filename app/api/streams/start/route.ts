import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAILY_API_URL = 'https://api.daily.co/v1'

interface DailyRoomResponse {
  id: string
  name: string
  url: string
  created_at: string
  config: Record<string, unknown>
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const dailyApiKey = process.env.DAILY_API_KEY
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily.co not configured' },
        { status: 500 }
      )
    }

    // Check if user already has an active stream
    const { data: existingStream } = await supabase
      .from('streams')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', 'live')
      .single()

    if (existingStream) {
      return NextResponse.json({
        stream: existingStream,
        message: 'Stream already active',
      })
    }

    // Generate unique room name
    const timestamp = Date.now()
    const roomName = `${profile.username}-${timestamp}`

    // Create Daily.co room
    const dailyResponse = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 50,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 86400, // Expire in 24 hours
        },
      }),
    })

    if (!dailyResponse.ok) {
      const error = await dailyResponse.text()
      console.error('Daily.co API error:', error)
      return NextResponse.json(
        { error: 'Failed to create streaming room' },
        { status: 500 }
      )
    }

    const dailyRoom: DailyRoomResponse = await dailyResponse.json()

    // Create stream record in database
    const { data: stream, error: dbError } = await supabase
      .from('streams')
      .insert({
        creator_id: user.id,
        room_name: dailyRoom.name,
        room_url: dailyRoom.url,
        status: 'live',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete the Daily room if DB insert fails
      await fetch(`${DAILY_API_URL}/rooms/${dailyRoom.name}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${dailyApiKey}` },
      })
      return NextResponse.json(
        { error: 'Failed to save stream' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stream })
  } catch (error) {
    console.error('Error starting stream:', error)
    return NextResponse.json(
      { error: 'Failed to start stream' },
      { status: 500 }
    )
  }
}
