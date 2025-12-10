import { useEffect, useRef, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { usePresenceStore, PresenceUser } from '@/stores/presenceStore'

interface UsePresenceOptions {
  // The bubble world ID to track presence in
  bubbleId: string
  // Current user info
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  } | null
  // Whether to enable presence (disable when not viewing a bubble)
  enabled?: boolean
}

export function usePresence({ bubbleId, user, enabled = true }: UsePresenceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const {
    viewers,
    isConnected,
    setViewers,
    addViewer,
    removeViewer,
    updateViewerPosition,
    setCurrentUserPresence,
    setConnected,
    setLoading,
    setError,
    reset,
  } = usePresenceStore()

  // Update current user's position in the space
  const updateMyPosition = useCallback(
    async (position: { x: number; y: number; z: number }) => {
      if (!channelRef.current || !user) return

      try {
        await channelRef.current.track({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          position,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Failed to update position:', err)
      }
    },
    [user]
  )

  // Subscribe to presence channel
  useEffect(() => {
    if (!enabled || !bubbleId) {
      reset()
      return
    }

    const channelName = `bubble:${bubbleId}`
    setLoading(true)

    const channel = supabaseRef.current.channel(channelName, {
      config: {
        presence: {
          key: user?.id || 'anonymous',
        },
      },
    })

    // Handle presence sync (initial state + subsequent syncs)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presenceUsers: PresenceUser[] = []

      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          // Don't include current user in viewers list
          if (presence.id !== user?.id) {
            presenceUsers.push({
              id: presence.id,
              username: presence.username,
              displayName: presence.displayName,
              avatarUrl: presence.avatarUrl,
              position: presence.position,
              joinedAt: presence.joinedAt,
              lastSeen: presence.lastSeen,
            })
          }
        })
      })

      setViewers(presenceUsers)
    })

    // Handle user joining
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      newPresences.forEach((presence: any) => {
        if (presence.id !== user?.id) {
          addViewer({
            id: presence.id,
            username: presence.username,
            displayName: presence.displayName,
            avatarUrl: presence.avatarUrl,
            position: presence.position,
            joinedAt: presence.joinedAt,
            lastSeen: presence.lastSeen,
          })
        }
      })
    })

    // Handle user leaving
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        removeViewer(presence.id)
      })
    })

    // Subscribe and track current user
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true, channelName)
        setLoading(false)

        // Track current user's presence
        if (user) {
          const presence: PresenceUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          }
          setCurrentUserPresence(presence)

          await channel.track(presence)
        }
      } else if (status === 'CHANNEL_ERROR') {
        setError('Failed to connect to presence channel')
        setConnected(false)
        setLoading(false)
      } else if (status === 'CLOSED') {
        setConnected(false)
      }
    })

    channelRef.current = channel

    // Cleanup on unmount or when bubbleId changes
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      reset()
    }
  }, [
    bubbleId,
    user?.id,
    user?.username,
    user?.displayName,
    user?.avatarUrl,
    enabled,
    setViewers,
    addViewer,
    removeViewer,
    setCurrentUserPresence,
    setConnected,
    setLoading,
    setError,
    reset,
  ])

  return {
    viewers,
    isConnected,
    updateMyPosition,
    viewerCount: viewers.length,
  }
}
