'use client'

import { useState, useEffect } from 'react'
import { NodeConnection } from '@/types'

interface NodeConnectionsProps {
  nodeId: string
  className?: string
}

export default function NodeConnections({ nodeId, className = '' }: NodeConnectionsProps) {
  const [connections, setConnections] = useState<NodeConnection[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function fetchConnections() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/nodes/${nodeId}/connections`)
        if (response.ok) {
          const data = await response.json()
          setConnections(data.connections || [])
          setConnectionCount(data.connection_count || 0)
        }
      } catch (error) {
        console.error('Error fetching node connections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (nodeId) {
      fetchConnections()
    }
  }, [nodeId])

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="text-white/40 text-sm">Loading connections...</div>
      </div>
    )
  }

  if (connectionCount === 0) {
    return null
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return date.toLocaleDateString()
  }

  // Group connections by month
  const groupedConnections = connections.reduce((groups, conn) => {
    const date = new Date(conn.added_at)
    const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(conn)
    return groups
  }, {} as Record<string, NodeConnection[]>)

  return (
    <div className={`${className}`}>
      {/* Header with count - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm font-medium">Connections</span>
          <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full">
            {connectionCount}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded connections list */}
      {isExpanded && (
        <div className="mt-3 space-y-4">
          {Object.entries(groupedConnections).map(([monthKey, monthConnections]) => (
            <div key={monthKey}>
              {/* Month header */}
              <div className="text-white/40 text-xs mb-2">{monthKey}</div>

              {/* Connections for this month */}
              <div className="space-y-2">
                {monthConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {/* User avatar */}
                    <div className="flex-shrink-0">
                      {conn.user.avatar_url ? (
                        <img
                          src={conn.user.avatar_url}
                          alt={conn.user.display_name || conn.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {(conn.user.display_name || conn.user.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Connection info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm truncate">
                          {conn.user.display_name || conn.user.username}
                        </span>
                        <span className="text-white/40 text-xs">
                          {formatRelativeTime(conn.added_at)}
                        </span>
                      </div>

                      {/* Bucket/collection name if applicable */}
                      {conn.bucket && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: conn.bucket.color }}
                          />
                          <span className="text-white/60 text-xs truncate">
                            {conn.bucket.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed preview - show first 3 users */}
      {!isExpanded && connections.length > 0 && (
        <div className="mt-2 flex items-center">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {connections.slice(0, 3).map((conn, index) => (
              <div
                key={conn.id}
                className="relative"
                style={{ zIndex: 3 - index }}
              >
                {conn.user.avatar_url ? (
                  <img
                    src={conn.user.avatar_url}
                    alt={conn.user.display_name || conn.user.username}
                    className="w-6 h-6 rounded-full object-cover border-2 border-black"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-black">
                    {(conn.user.display_name || conn.user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {connections.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs border-2 border-black">
                +{connections.length - 3}
              </div>
            )}
          </div>

          {/* Names preview */}
          <div className="ml-3 text-white/60 text-xs truncate">
            {connections.slice(0, 2).map((conn, i) => (
              <span key={conn.id}>
                {conn.user.display_name || conn.user.username}
                {i < Math.min(connections.length - 1, 1) && ', '}
              </span>
            ))}
            {connections.length > 2 && ` and ${connections.length - 2} more`}
          </div>
        </div>
      )}
    </div>
  )
}
