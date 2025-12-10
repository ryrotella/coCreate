import { create } from 'zustand'

// Presence user info - what we track for each online user
export interface PresenceUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  // Where they are in the 3D space (optional)
  position?: { x: number; y: number; z: number }
  // When they joined this space
  joinedAt: string
  // Last activity timestamp
  lastSeen: string
}

interface PresenceState {
  // Users currently in the same bubble space
  viewers: PresenceUser[]

  // Current user's presence info
  currentUserPresence: PresenceUser | null

  // Connection status
  isConnected: boolean
  channelName: string | null

  // Loading/error states
  isLoading: boolean
  error: string | null

  // Actions
  setViewers: (viewers: PresenceUser[]) => void
  addViewer: (viewer: PresenceUser) => void
  removeViewer: (userId: string) => void
  updateViewerPosition: (userId: string, position: { x: number; y: number; z: number }) => void
  setCurrentUserPresence: (presence: PresenceUser | null) => void
  setConnected: (connected: boolean, channelName?: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  viewers: [],
  currentUserPresence: null,
  isConnected: false,
  channelName: null,
  isLoading: false,
  error: null,

  setViewers: (viewers) => set({ viewers }),

  addViewer: (viewer) =>
    set((state) => {
      // Don't add duplicates
      if (state.viewers.some((v) => v.id === viewer.id)) {
        return state
      }
      return { viewers: [...state.viewers, viewer] }
    }),

  removeViewer: (userId) =>
    set((state) => ({
      viewers: state.viewers.filter((v) => v.id !== userId),
    })),

  updateViewerPosition: (userId, position) =>
    set((state) => ({
      viewers: state.viewers.map((v) =>
        v.id === userId ? { ...v, position, lastSeen: new Date().toISOString() } : v
      ),
    })),

  setCurrentUserPresence: (presence) => set({ currentUserPresence: presence }),

  setConnected: (connected, channelName) =>
    set({
      isConnected: connected,
      channelName: channelName || null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      viewers: [],
      currentUserPresence: null,
      isConnected: false,
      channelName: null,
      isLoading: false,
      error: null,
    }),
}))
