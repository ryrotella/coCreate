'use client'

import { useEffect, useRef } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'
import { StreamWithCreator } from '@/types'

interface StreamViewProps {
  stream: StreamWithCreator
  onClose?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function StreamView({
  stream,
  onClose,
  isMinimized = false,
  onToggleMinimize,
}: StreamViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callRef = useRef<DailyCall | null>(null)

  useEffect(() => {
    if (!containerRef.current || !stream.room_url) return

    // Create Daily iframe
    const call = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px',
      },
      showLeaveButton: false,
      showFullscreenButton: true,
    })

    callRef.current = call

    // Join as viewer
    call.join({
      url: stream.room_url,
      userName: 'Viewer',
    })

    return () => {
      if (callRef.current) {
        callRef.current.leave()
        callRef.current.destroy()
        callRef.current = null
      }
    }
  }, [stream.room_url])

  const creatorName = stream.creator?.display_name || stream.creator?.username || 'Unknown'

  return (
    <div
      className={`bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700
                  transition-all duration-300 ${
                    isMinimized ? 'w-80 h-auto' : 'w-[480px] h-[360px]'
                  }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600">
        <div className="flex items-center gap-2">
          {stream.creator?.avatar_url ? (
            <img
              src={stream.creator.avatar_url}
              alt={creatorName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
              {creatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white font-medium text-sm">{creatorName}</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1 text-white/80 hover:text-white transition-colors"
            >
              {isMinimized ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H2.75a.75.75 0 000 1.5h4.5A.75.75 0 008 7.25v-4.5a.75.75 0 00-1.5 0v2.69L3.28 2.22zM13.5 13.25v2.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.28-.53v-4.5a.75.75 0 011.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Video container */}
      {!isMinimized && (
        <div ref={containerRef} className="w-full h-[calc(100%-40px)] bg-black" />
      )}

      {/* Minimized state */}
      {isMinimized && (
        <div className="px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
          </svg>
          Stream minimized - click expand to watch
        </div>
      )}
    </div>
  )
}
