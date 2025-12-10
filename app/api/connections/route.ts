import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ConnectionType } from '@/types'

// GET /api/connections - Get connections for a user
// Query params:
//   - userId: target user (defaults to authenticated user)
//   - type: 'followers' | 'following' | 'all' (defaults to 'all')
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'

    // Get target user ID
    let targetUserId = userIdParam

    if (!targetUserId) {
      const { data: { user } } = await serverClient.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      targetUserId = user.id
    }

    let followers: { id: string; follower_id: string; following_id: string; connection_type: string; created_at: string; follower: { id: string; username: string; display_name: string | null; avatar_url: string | null } }[] = []
    let following: { id: string; follower_id: string; following_id: string; connection_type: string; created_at: string; following: { id: string; username: string; display_name: string | null; avatar_url: string | null } }[] = []

    // Fetch followers (people who follow this user)
    if (type === 'followers' || type === 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('connections')
        .select(`
          id,
          follower_id,
          following_id,
          connection_type,
          created_at,
          follower:users!connections_follower_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching followers:', error)
      } else {
        followers = data || []
      }
    }

    // Fetch following (people this user follows)
    if (type === 'following' || type === 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('connections')
        .select(`
          id,
          follower_id,
          following_id,
          connection_type,
          created_at,
          following:users!connections_following_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('follower_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching following:', error)
      } else {
        following = data || []
      }
    }

    return NextResponse.json({
      followers,
      following,
      followerCount: followers.length,
      followingCount: following.length,
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

// POST /api/connections - Create a new connection (follow)
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

    // Get authenticated user
    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { followingId, connectionType = 'follow' } = body as {
      followingId: string
      connectionType?: ConnectionType
    }

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required' },
        { status: 400 }
      )
    }

    // Prevent self-follow
    if (followingId === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if the target user exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUser, error: targetError } = await (supabase as any)
      .from('users')
      .select('id, username')
      .eq('id', followingId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if connection already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('connections')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      )
    }

    // Create the connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error: createError } = await (supabase as any)
      .from('connections')
      .insert({
        follower_id: user.id,
        following_id: followingId,
        connection_type: connectionType,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating connection:', createError)
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ connection }, { status: 201 })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}

// DELETE /api/connections - Remove a connection (unfollow)
export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()

    // Get authenticated user
    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('followingId')

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required' },
        { status: 400 }
      )
    }

    // Delete the connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('connections')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (deleteError) {
      console.error('Error deleting connection:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
