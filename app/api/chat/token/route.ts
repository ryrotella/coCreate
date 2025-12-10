import { NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for name/avatar
    const { data: profile } = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_KEY
    const apiSecret = process.env.STREAM_CHAT_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Stream Chat not configured' },
        { status: 500 }
      )
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)

    // Upsert user in Stream Chat
    await serverClient.upsertUser({
      id: user.id,
      name: profile.display_name || profile.username,
      username: profile.username,
      image: profile.avatar_url || undefined,
    })

    // Generate token valid for 24 hours
    const token = serverClient.createToken(user.id)

    return NextResponse.json({
      token,
      userId: user.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    })
  } catch (error) {
    console.error('Error generating Stream Chat token:', error)
    return NextResponse.json(
      { error: 'Failed to generate chat token' },
      { status: 500 }
    )
  }
}
