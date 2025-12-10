import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/users/[username] - Fetch user profile by username
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createAdminClient()
    const { username } = params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Fetch user with node count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at,
        nodes:nodes(count)
      `)
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch follower count (people who follow this user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: followerCount } = await (supabase as any)
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    // Fetch following count (people this user follows)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: followingCount } = await (supabase as any)
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    // Transform response
    const profile = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      createdAt: user.created_at,
      nodeCount: user.nodes?.[0]?.count || 0,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
