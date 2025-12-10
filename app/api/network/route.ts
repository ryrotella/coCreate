import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { NetworkNode, NetworkLink, NetworkGraphData, ConnectionType } from '@/types'

// GET /api/network - Fetch all users as network nodes with connections
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all users with their node counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users, error: usersError } = await (supabase as any)
      .from('users')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        nodes:nodes(count)
      `)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Transform users to network nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: NetworkNode[] = (users || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      nodeCount: user.nodes?.[0]?.count || 0,
    }))

    // Fetch all connections to display as links
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connections, error: connectionsError } = await (supabase as any)
      .from('connections')
      .select('id, follower_id, following_id, connection_type')

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError)
      // Don't fail the request, just return empty links
    }

    // Transform connections to network links
    const links: NetworkLink[] = (connections || []).map((conn: {
      id: string
      follower_id: string
      following_id: string
      connection_type: string
    }) => ({
      id: conn.id,
      source: conn.follower_id,
      target: conn.following_id,
      type: (conn.connection_type || 'follow') as ConnectionType,
    }))

    const graphData: NetworkGraphData = {
      nodes,
      links,
    }

    return NextResponse.json(graphData)
  } catch (error) {
    console.error('Error fetching network data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    )
  }
}
