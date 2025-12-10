import { create } from 'zustand'

export type ControlMode = 'editor' | 'fly'
export type EnvironmentEditTarget = 'sky' | 'ground' | 'fog' | null
export type EnvironmentEditTool = 'picker' | 'sampler' | null

interface UIState {
  // Selection
  selectedNodeId: string | null
  hoveredNodeId: string | null

  // Control mode
  controlMode: ControlMode

  // Editing modes
  isEditMode: boolean
  isDragging: boolean
  isEnvironmentEditorOpen: boolean
  isEnvironmentEditMode: boolean
  environmentEditTarget: EnvironmentEditTarget
  environmentEditTool: EnvironmentEditTool
  isNodeLibraryOpen: boolean

  // Node detail modal
  nodeDetailModalOpen: boolean
  nodeDetailModalId: string | null

  // Camera state (for saving/restoring)
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]

  // Actions
  setSelectedNode: (nodeId: string | null) => void
  setHoveredNode: (nodeId: string | null) => void
  setControlMode: (mode: ControlMode) => void
  toggleControlMode: () => void
  setEditMode: (enabled: boolean) => void
  setDragging: (dragging: boolean) => void
  toggleEnvironmentEditor: () => void
  setEnvironmentEditMode: (enabled: boolean) => void
  setEnvironmentEditTarget: (target: EnvironmentEditTarget) => void
  setEnvironmentEditTool: (tool: EnvironmentEditTool) => void
  toggleNodeLibrary: () => void
  openNodeDetailModal: (nodeId: string) => void
  closeNodeDetailModal: () => void
  setCameraPosition: (position: [number, number, number]) => void
  setCameraTarget: (target: [number, number, number]) => void
  reset: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  controlMode: 'fly',
  isEditMode: false,
  isDragging: false,
  isEnvironmentEditorOpen: false,
  isEnvironmentEditMode: false,
  environmentEditTarget: null,
  environmentEditTool: null,
  isNodeLibraryOpen: false,
  nodeDetailModalOpen: false,
  nodeDetailModalId: null,
  cameraPosition: [0, 5, 10],
  cameraTarget: [0, 0, 0],

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  setControlMode: (mode) => set({ controlMode: mode }),

  toggleControlMode: () =>
    set((state) => ({
      controlMode: state.controlMode === 'editor' ? 'fly' : 'editor',
    })),

  setEditMode: (enabled) => set({ isEditMode: enabled }),

  setDragging: (dragging) => set({ isDragging: dragging }),

  toggleEnvironmentEditor: () =>
    set((state) => ({
      isEnvironmentEditorOpen: !state.isEnvironmentEditorOpen,
      isNodeLibraryOpen: false, // Close other panels
    })),

  setEnvironmentEditMode: (enabled) =>
    set({
      isEnvironmentEditMode: enabled,
      environmentEditTarget: null,
      environmentEditTool: enabled ? 'picker' : null,
    }),

  setEnvironmentEditTarget: (target) =>
    set({ environmentEditTarget: target }),

  setEnvironmentEditTool: (tool) =>
    set({ environmentEditTool: tool }),

  toggleNodeLibrary: () =>
    set((state) => ({
      isNodeLibraryOpen: !state.isNodeLibraryOpen,
      isEnvironmentEditorOpen: false, // Close other panels
    })),

  openNodeDetailModal: (nodeId) =>
    set({
      nodeDetailModalOpen: true,
      nodeDetailModalId: nodeId,
    }),

  closeNodeDetailModal: () =>
    set({
      nodeDetailModalOpen: false,
      nodeDetailModalId: null,
    }),

  setCameraPosition: (position) => set({ cameraPosition: position }),

  setCameraTarget: (target) => set({ cameraTarget: target }),

  reset: () =>
    set({
      selectedNodeId: null,
      hoveredNodeId: null,
      controlMode: 'fly',
      isEditMode: false,
      isDragging: false,
      isEnvironmentEditorOpen: false,
      isEnvironmentEditMode: false,
      environmentEditTarget: null,
      environmentEditTool: null,
      isNodeLibraryOpen: false,
      nodeDetailModalOpen: false,
      nodeDetailModalId: null,
      cameraPosition: [0, 5, 10],
      cameraTarget: [0, 0, 0],
    }),
}))
