'use client'

import { useChat } from '@/contexts/ChatContext'

interface ChatToggleButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function ChatToggleButton({ onClick, isOpen }: ChatToggleButtonProps) {
  const { unreadCount, isConnected } = useChat()

  return (
    <button
      onClick={onClick}
      className={`fixed right-4 bottom-4 z-40 p-4 rounded-full shadow-lg
                  transition-all duration-200 hover:scale-105 active:scale-95
                  ${isOpen ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-500 hover:bg-blue-600'}
                  ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!isConnected}
    >
      {isOpen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-6 h-6 text-white"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-6 h-6 text-white"
        >
          <path
            fillRule="evenodd"
            d="M10 3c-4.31 0-8 3.033-8 7 0 2.024.978 3.825 2.499 5.085a3.478 3.478 0 01-.522 1.756.75.75 0 00.584 1.143 5.976 5.976 0 003.936-1.108c.487.082.99.124 1.503.124 4.31 0 8-3.033 8-7s-3.69-7-8-7z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {/* Unread badge */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center
                         min-w-[20px] h-5 px-1.5 text-xs font-bold text-white
                         bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
