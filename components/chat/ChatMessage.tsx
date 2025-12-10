'use client'

import { formatDistanceToNow } from '@/lib/utils'

interface ChatMessageProps {
  id: string
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  text: string
  createdAt: Date
  isOwnMessage: boolean
}

export function ChatMessage({
  username,
  displayName,
  avatarUrl,
  text,
  createdAt,
  isOwnMessage,
}: ChatMessageProps) {
  return (
    <div
      className={`flex gap-2 px-3 py-2 ${
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
            {(displayName || username).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Message content */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        }`}
      >
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-700">
            {displayName || username}
          </span>
          <span className="text-[10px] text-gray-400">
            {formatDistanceToNow(createdAt)}
          </span>
        </div>
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
