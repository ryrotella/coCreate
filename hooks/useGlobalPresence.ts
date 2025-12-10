import { useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface OnlineUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  lastSeen: string
}

interface UseGlobalPresenceOptions {
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  } | null
  enabled?: boolean
}

export function useGlobalPresence({ user, enabled = true }: UseGlobalPresenceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const channel = supabaseRef.current.channel('global:presence', {
      config: {
        presence: {
          key: user?.id || 'anonymous',
        },
      },
    })

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = new Map<string, OnlineUser>()

      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          users.set(presence.id, {
            id: presence.id,
            username: presence.username,
            displayName: presence.displayName,
            avatarUrl: presence.avatarUrl,
            lastSeen: presence.lastSeen,
          })
        })
      })

      setOnlineUsers(users)
    })

    // Handle user joining
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev)
        newPresences.forEach((presence: any) => {
          next.set(presence.id, {
            id: presence.id,
            username: presence.username,
            displayName: presence.displayName,
            avatarUrl: presence.avatarUrl,
            lastSeen: presence.lastSeen,
          })
        })
        return next
      })
    })

    // Handle user leaving
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev)
        leftPresences.forEach((presence: any) => {
          next.delete(presence.id)
        })
        return next
      })
    })

    // Subscribe and track current user
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)

        if (user) {
          await channel.track({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            lastSeen: new Date().toISOString(),
          })
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setOnlineUsers(new Map())
      setIsConnected(false)
    }
  }, [user?.id, user?.username, user?.displayName, user?.avatarUrl, enabled])

  // Helper to check if a specific user is online
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId)
  }

  return {
    onlineUsers,
    onlineUserIds: Array.from(onlineUsers.keys()),
    onlineCount: onlineUsers.size,
    isConnected,
    isUserOnline,
  }
}
