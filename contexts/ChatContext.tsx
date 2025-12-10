'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { StreamChat, Channel as StreamChannel } from 'stream-chat'
import { useAuth } from './AuthContext'

interface ChatUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

interface ChatContextType {
  client: StreamChat | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  currentUser: ChatUser | null
  activeChannel: StreamChannel | null
  unreadCount: number
  setActiveChannel: (channel: StreamChannel | null) => void
  joinBubbleChannel: (bubbleId: string) => Promise<StreamChannel | null>
  joinGlobalChannel: () => Promise<StreamChannel | null>
  createDMChannel: (otherUserId: string) => Promise<StreamChannel | null>
  disconnect: () => Promise<void>
}

const ChatContext = createContext<ChatContextType>({
  client: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  currentUser: null,
  activeChannel: null,
  unreadCount: 0,
  setActiveChannel: () => {},
  joinBubbleChannel: async () => null,
  joinGlobalChannel: async () => null,
  createDMChannel: async () => null,
  disconnect: async () => {},
})

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Connect to Stream Chat when user is authenticated
  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (client) {
        client.disconnectUser()
        setClient(null)
        setIsConnected(false)
        setCurrentUser(null)
        setActiveChannel(null)
      }
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_KEY
    if (!apiKey) {
      setError('Stream Chat not configured')
      return
    }

    const connectUser = async () => {
      setIsConnecting(true)
      setError(null)

      try {
        // Get token from our API
        const response = await fetch('/api/chat/token', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to get chat token')
        }

        const { token, userId, username, displayName, avatarUrl } = await response.json()

        // Initialize Stream Chat client
        const chatClient = StreamChat.getInstance(apiKey)

        // Connect user
        await chatClient.connectUser(
          {
            id: userId,
            name: displayName || username,
            username,
            image: avatarUrl,
          },
          token
        )

        setClient(chatClient)
        setCurrentUser({ id: userId, username, displayName, avatarUrl })
        setIsConnected(true)

        // Listen for unread count changes
        chatClient.on('notification.message_new', () => {
          // Cast to access total_unread_count which exists on OwnUserResponse
          const user = chatClient.user as { total_unread_count?: number } | undefined
          const totalUnread = user?.total_unread_count || 0
          setUnreadCount(totalUnread)
        })

        chatClient.on('notification.mark_read', () => {
          const user = chatClient.user as { total_unread_count?: number } | undefined
          const totalUnread = user?.total_unread_count || 0
          setUnreadCount(totalUnread)
        })
      } catch (err) {
        console.error('Failed to connect to Stream Chat:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect to chat')
      } finally {
        setIsConnecting(false)
      }
    }

    connectUser()

    return () => {
      // Cleanup on unmount
    }
  }, [user])

  // Join a bubble-specific channel
  const joinBubbleChannel = useCallback(async (bubbleId: string): Promise<StreamChannel | null> => {
    if (!client || !currentUser) return null

    try {
      const channel = client.channel('messaging', `bubble-${bubbleId}`, {
        members: [currentUser.id],
      })

      await channel.watch()
      return channel
    } catch (err) {
      console.error('Failed to join bubble channel:', err)
      return null
    }
  }, [client, currentUser])

  // Join the global channel
  const joinGlobalChannel = useCallback(async (): Promise<StreamChannel | null> => {
    if (!client || !currentUser) return null

    try {
      const channel = client.channel('messaging', 'global', {
        members: [currentUser.id],
      })

      await channel.watch()
      return channel
    } catch (err) {
      console.error('Failed to join global channel:', err)
      return null
    }
  }, [client, currentUser])

  // Create or get a DM channel with another user
  const createDMChannel = useCallback(async (otherUserId: string): Promise<StreamChannel | null> => {
    if (!client || !currentUser) return null

    try {
      // Sort user IDs for consistent channel naming
      const members = [currentUser.id, otherUserId].sort()
      const channelId = `dm-${members.join('-')}`

      const channel = client.channel('messaging', channelId, {
        members,
      })

      await channel.watch()
      return channel
    } catch (err) {
      console.error('Failed to create DM channel:', err)
      return null
    }
  }, [client, currentUser])

  // Disconnect from Stream Chat
  const disconnect = useCallback(async () => {
    if (client) {
      await client.disconnectUser()
      setClient(null)
      setIsConnected(false)
      setCurrentUser(null)
      setActiveChannel(null)
      setUnreadCount(0)
    }
  }, [client])

  return (
    <ChatContext.Provider
      value={{
        client,
        isConnected,
        isConnecting,
        error,
        currentUser,
        activeChannel,
        unreadCount,
        setActiveChannel,
        joinBubbleChannel,
        joinGlobalChannel,
        createDMChannel,
        disconnect,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
