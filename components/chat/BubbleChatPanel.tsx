'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Channel as StreamChannel, MessageResponse, FormatMessageResponse } from 'stream-chat'
import { useChat } from '@/contexts/ChatContext'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface Message {
  id: string
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  text: string
  createdAt: Date
}

interface BubbleChatPanelProps {
  bubbleId: string
  isOpen: boolean
  onClose: () => void
}

export function BubbleChatPanel({ bubbleId, isOpen, onClose }: BubbleChatPanelProps) {
  const { isConnected, currentUser, joinBubbleChannel } = useChat()
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Join the bubble channel when panel opens
  useEffect(() => {
    if (!isOpen || !isConnected || !bubbleId) return

    let mounted = true
    const initChannel = async () => {
      setIsLoading(true)
      const ch = await joinBubbleChannel(bubbleId)

      if (!mounted || !ch) {
        setIsLoading(false)
        return
      }

      setChannel(ch)

      // Load existing messages
      const existingMessages = ch.state.messages.map(transformMessage)
      setMessages(existingMessages)
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)

      // Listen for new messages
      ch.on('message.new', (event) => {
        if (event.message) {
          const newMsg = transformMessage(event.message as MessageResponse)
          setMessages((prev) => [...prev, newMsg])
          setTimeout(scrollToBottom, 100)
        }
      })
    }

    initChannel()

    return () => {
      mounted = false
    }
  }, [isOpen, isConnected, bubbleId, joinBubbleChannel, scrollToBottom])

  // Transform Stream Chat message to our format
  // Accepts both MessageResponse (from events) and FormatMessageResponse (from state)
  const transformMessage = (msg: MessageResponse | FormatMessageResponse): Message => ({
    id: msg.id,
    userId: msg.user?.id || '',
    username: (msg.user?.username as string) || msg.user?.id || 'Unknown',
    displayName: (msg.user?.name as string) || null,
    avatarUrl: (msg.user?.image as string) || null,
    text: msg.text || '',
    createdAt: msg.created_at instanceof Date ? msg.created_at : new Date(msg.created_at || Date.now()),
  })

  // Send a message
  const handleSend = async (text: string) => {
    if (!channel) return

    try {
      await channel.sendMessage({ text })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-4 bottom-4 w-80 h-[500px] bg-white rounded-xl shadow-2xl
                    flex flex-col overflow-hidden z-50 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-white"
          >
            <path
              fillRule="evenodd"
              d="M10 3c-4.31 0-8 3.033-8 7 0 2.024.978 3.825 2.499 5.085a3.478 3.478 0 01-.522 1.756.75.75 0 00.584 1.143 5.976 5.976 0 003.936-1.108c.487.082.99.124 1.503.124 4.31 0 8-3.033 8-7s-3.69-7-8-7z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-white font-medium">Bubble Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 bg-gray-50">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Connecting to chat...
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mb-2 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              {...msg}
              isOwnMessage={msg.userId === currentUser?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!isConnected || !channel}
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
      />
    </div>
  )
}
