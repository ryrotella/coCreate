'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'
import { useAuth } from './AuthContext'
import { Stream, StreamWithCreator } from '@/types'

interface StreamContextType {
  // Current user's stream state
  isStreaming: boolean
  currentStream: Stream | null
  callObject: DailyCall | null
  isStarting: boolean
  isStopping: boolean
  error: string | null

  // Active streams across platform
  activeStreams: StreamWithCreator[]
  isLoadingStreams: boolean

  // Actions
  startStream: () => Promise<void>
  endStream: () => Promise<void>
  refreshActiveStreams: () => Promise<void>

  // Check if a specific user is streaming
  isUserStreaming: (userId: string) => boolean
  getUserStream: (userId: string) => StreamWithCreator | null
}

const StreamContext = createContext<StreamContextType>({
  isStreaming: false,
  currentStream: null,
  callObject: null,
  isStarting: false,
  isStopping: false,
  error: null,
  activeStreams: [],
  isLoadingStreams: false,
  startStream: async () => {},
  endStream: async () => {},
  refreshActiveStreams: async () => {},
  isUserStreaming: () => false,
  getUserStream: () => null,
})

export function StreamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStream, setCurrentStream] = useState<Stream | null>(null)
  const [callObject, setCallObject] = useState<DailyCall | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStreams, setActiveStreams] = useState<StreamWithCreator[]>([])
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch all active streams
  const refreshActiveStreams = useCallback(async () => {
    try {
      setIsLoadingStreams(true)
      const response = await fetch('/api/streams/active')
      if (response.ok) {
        const { streams } = await response.json()
        setActiveStreams(streams || [])
      }
    } catch (err) {
      console.error('Failed to fetch active streams:', err)
    } finally {
      setIsLoadingStreams(false)
    }
  }, [])

  // Poll for active streams every 30 seconds
  useEffect(() => {
    refreshActiveStreams()

    pollIntervalRef.current = setInterval(refreshActiveStreams, 30000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [refreshActiveStreams])

  // Check if current user has an active stream on mount
  useEffect(() => {
    if (!user) {
      setIsStreaming(false)
      setCurrentStream(null)
      return
    }

    const checkExistingStream = async () => {
      try {
        const response = await fetch(`/api/streams/${user.id}`)
        if (response.ok) {
          const { stream } = await response.json()
          if (stream) {
            setCurrentStream(stream)
            setIsStreaming(true)
          }
        }
      } catch (err) {
        console.error('Failed to check existing stream:', err)
      }
    }

    checkExistingStream()
  }, [user])

  // Start a new stream
  const startStream = useCallback(async () => {
    if (!user || isStarting || isStreaming) return

    setIsStarting(true)
    setError(null)

    try {
      // Create stream via API
      const response = await fetch('/api/streams/start', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start stream')
      }

      const { stream } = await response.json()
      setCurrentStream(stream)

      // Create Daily call object
      const call = DailyIframe.createCallObject({
        url: stream.room_url,
      })

      // Join the call
      await call.join()

      setCallObject(call)
      setIsStreaming(true)

      // Refresh active streams to include this one
      await refreshActiveStreams()
    } catch (err) {
      console.error('Failed to start stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to start stream')
    } finally {
      setIsStarting(false)
    }
  }, [user, isStarting, isStreaming, refreshActiveStreams])

  // End current stream
  const endStream = useCallback(async () => {
    if (!user || isStopping || !isStreaming) return

    setIsStopping(true)
    setError(null)

    try {
      // Leave the Daily call
      if (callObject) {
        await callObject.leave()
        await callObject.destroy()
        setCallObject(null)
      }

      // End stream via API
      const response = await fetch('/api/streams/end', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to end stream')
      }

      setCurrentStream(null)
      setIsStreaming(false)

      // Refresh active streams to remove this one
      await refreshActiveStreams()
    } catch (err) {
      console.error('Failed to end stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to end stream')
    } finally {
      setIsStopping(false)
    }
  }, [user, isStopping, isStreaming, callObject, refreshActiveStreams])

  // Cleanup call object on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave()
        callObject.destroy()
      }
    }
  }, [callObject])

  // Check if a specific user is streaming
  const isUserStreaming = useCallback(
    (userId: string) => activeStreams.some((s) => s.creator_id === userId),
    [activeStreams]
  )

  // Get a specific user's stream
  const getUserStream = useCallback(
    (userId: string) => activeStreams.find((s) => s.creator_id === userId) || null,
    [activeStreams]
  )

  return (
    <StreamContext.Provider
      value={{
        isStreaming,
        currentStream,
        callObject,
        isStarting,
        isStopping,
        error,
        activeStreams,
        isLoadingStreams,
        startStream,
        endStream,
        refreshActiveStreams,
        isUserStreaming,
        getUserStream,
      }}
    >
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return context
}
