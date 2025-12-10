import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/bubbles - Fetch bubble world with environment (optionally filtered by user)
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Get target user ID - either from query param or authenticated user
    let targetUserId = userId

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

    // Fetch the bubble world with user data
    const { data: bubble, error } = await supabase
      .from('bubble_worlds')
      .select('*, users!user_id(*)')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!bubble) {
      return NextResponse.json(
        { error: 'No bubble world found' },
        { status: 404 }
      )
    }

    // Extract the user data from the joined query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = Array.isArray((bubble as any).users) ? (bubble as any).users[0] : (bubble as any).users

    return NextResponse.json({ bubble, owner })
  } catch (error) {
    console.error('Error fetching bubble:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bubble' },
      { status: 500 }
    )
  }
}
