'use client'

import { useStream } from '@/contexts/StreamContext'
import { useAuth } from '@/contexts/AuthContext'

export function StreamControls() {
  const { user } = useAuth()
  const {
    isStreaming,
    isStarting,
    isStopping,
    error,
    startStream,
    endStream,
  } = useStream()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {isStreaming ? (
        <button
          onClick={endStream}
          disabled={isStopping}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600
                     disabled:bg-red-300 disabled:cursor-not-allowed
                     text-white rounded-lg transition-colors font-medium"
        >
          {isStopping ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Ending...
            </>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              End Stream
            </>
          )}
        </button>
      ) : (
        <button
          onClick={startStream}
          disabled={isStarting}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500
                     hover:from-red-600 hover:to-pink-600
                     disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                     text-white rounded-lg transition-all font-medium shadow-lg"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
              </svg>
              Go Live
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
