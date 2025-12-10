import { useEffect, useState, useCallback } from 'react'
import { NetworkGraphData } from '@/types'

export function useNetworkData() {
  const [graphData, setGraphData] = useState<NetworkGraphData>({ nodes: [], links: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNetworkData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/network')

      if (!response.ok) {
        throw new Error('Failed to fetch network data')
      }

      const data = await response.json()
      setGraphData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load network'
      setError(errorMessage)
      console.error('Error loading network data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNetworkData()
  }, [fetchNetworkData])

  return { graphData, isLoading, error, refetch: fetchNetworkData }
}
