'use client'

import { useState } from 'react'
import { useStream } from '@/contexts/StreamContext'
import { StreamView } from './StreamView'
import { StreamIndicator } from './StreamIndicator'
import { StreamWithCreator } from '@/types'

interface StreamOverlayProps {
  viewingUserId?: string
}

export function StreamOverlay({ viewingUserId }: StreamOverlayProps) {
  const { activeStreams, isUserStreaming, getUserStream } = useStream()
  const [selectedStream, setSelectedStream] = useState<StreamWithCreator | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isListOpen, setIsListOpen] = useState(false)

  // Check if the user being viewed is streaming
  const viewingUserStream = viewingUserId ? getUserStream(viewingUserId) : null

  // Filter to show relevant streams (either the viewed user's stream or all active)
  const relevantStreams = viewingUserStream
    ? [viewingUserStream]
    : activeStreams.slice(0, 5) // Show up to 5 active streams

  if (relevantStreams.length === 0) return null

  return (
    <>
      {/* Stream Indicator Button */}
      <div className="fixed left-4 bottom-20 z-40">
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm
                     hover:bg-black/80 rounded-lg transition-colors shadow-lg"
        >
          <StreamIndicator size="sm" showText={false} />
          <span className="text-white font-medium text-sm">
            {relevantStreams.length} Live
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 text-white transition-transform ${
              isListOpen ? 'rotate-180' : ''
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Stream List Dropdown */}
        {isListOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900/95 backdrop-blur-sm
                          rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-white font-medium text-sm">Live Streams</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {relevantStreams.map((stream) => {
                const creatorName =
                  stream.creator?.display_name || stream.creator?.username || 'Unknown'
                return (
                  <button
                    key={stream.id}
                    onClick={() => {
                      setSelectedStream(stream)
                      setIsListOpen(false)
                      setIsMinimized(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10
                               transition-colors text-left"
                  >
                    {stream.creator?.avatar_url ? (
                      <img
                        src={stream.creator.avatar_url}
                        alt={creatorName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                                      flex items-center justify-center text-white font-bold">
                        {creatorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {creatorName}
                      </p>
                      <p className="text-gray-400 text-xs">
                        @{stream.creator?.username}
                      </p>
                    </div>
                    <StreamIndicator size="sm" showText={false} />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stream View Overlay */}
      {selectedStream && (
        <div className="fixed right-4 bottom-4 z-50">
          <StreamView
            stream={selectedStream}
            onClose={() => setSelectedStream(null)}
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
          />
        </div>
      )}
    </>
  )
}
