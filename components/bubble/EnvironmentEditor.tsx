'use client'

import { useEffect, useRef } from 'react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useUIStore } from '@/stores/uiStore'

export default function EnvironmentEditor() {
  const { environment, updateEnvironment, saveEnvironment } = useBubbleStore()
  const { isEnvironmentEditorOpen, toggleEnvironmentEditor } = useUIStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save environment changes with debouncing
  useEffect(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule a save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(() => {
      saveEnvironment()
    }, 1000)

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [environment, saveEnvironment])

  if (!isEnvironmentEditorOpen) return null

  const presets = [
    {
      name: 'Clean',
      env: {
        skyColor: '#ffffff',
        groundColor: '#e0e0e0',
        fogColor: '#f5f5f5',
        fogDensity: 0.01,
        lightIntensity: 1.2,
      },
    },
    {
      name: 'Sunset',
      env: {
        skyColor: '#ff6b6b',
        groundColor: '#f4a261',
        fogColor: '#ffd166',
        fogDensity: 0.02,
        lightIntensity: 0.8,
      },
    },
    {
      name: 'Ocean',
      env: {
        skyColor: '#48cae4',
        groundColor: '#0077b6',
        fogColor: '#90e0ef',
        fogDensity: 0.025,
        lightIntensity: 0.9,
      },
    },
    {
      name: 'Forest',
      env: {
        skyColor: '#a8e6cf',
        groundColor: '#56ab2f',
        fogColor: '#dcedc1',
        fogDensity: 0.02,
        lightIntensity: 1.0,
      },
    },
    {
      name: 'Candy',
      env: {
        skyColor: '#ff99c8',
        groundColor: '#fcf6bd',
        fogColor: '#d0f4de',
        fogDensity: 0.01,
        lightIntensity: 1.2,
      },
    },
    {
      name: 'Lavender',
      env: {
        skyColor: '#e6e6fa',
        groundColor: '#9b87f5',
        fogColor: '#d8d0f0',
        fogDensity: 0.015,
        lightIntensity: 1.1,
      },
    },
    {
      name: 'Peach',
      env: {
        skyColor: '#ffecd2',
        groundColor: '#fcb69f',
        fogColor: '#fff5ee',
        fogDensity: 0.01,
        lightIntensity: 1.1,
      },
    },
    {
      name: 'Night',
      env: {
        skyColor: '#1a1a2e',
        groundColor: '#16213e',
        fogColor: '#0f3460',
        fogDensity: 0.03,
        lightIntensity: 0.4,
      },
    },
    {
      name: 'Void',
      env: {
        skyColor: '#000000',
        groundColor: '#111111',
        fogColor: '#222222',
        fogDensity: 0.05,
        lightIntensity: 0.5,
      },
    },
  ]

  return (
    <div className="absolute right-4 top-20 w-80 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white pointer-events-auto max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Environment</h2>
        <button
          onClick={toggleEnvironmentEditor}
          className="text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateEnvironment(preset.env)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Background Section */}
      <div className="mb-4 pb-4 border-b border-white/20">
        <h3 className="text-sm font-semibold text-white/80 mb-3">Background Gradient</h3>

        {/* Top Color (Sky) */}
        <div className="mb-3">
          <label className="block text-xs text-white/60 mb-1">Top Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={environment.skyColor}
              onChange={(e) => updateEnvironment({ skyColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={environment.skyColor}
              onChange={(e) => updateEnvironment({ skyColor: e.target.value })}
              className="flex-1 bg-white/10 rounded px-2 py-1 text-sm font-mono"
            />
          </div>
        </div>

        {/* Bottom Color (Ground) */}
        <div>
          <label className="block text-xs text-white/60 mb-1">Bottom Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={environment.groundColor}
              onChange={(e) => updateEnvironment({ groundColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={environment.groundColor}
              onChange={(e) => updateEnvironment({ groundColor: e.target.value })}
              className="flex-1 bg-white/10 rounded px-2 py-1 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Fog Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Fog Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={environment.fogColor}
            onChange={(e) => updateEnvironment({ fogColor: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={environment.fogColor}
            onChange={(e) => updateEnvironment({ fogColor: e.target.value })}
            className="flex-1 bg-white/10 rounded px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      {/* Fog Density */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Fog Density: {environment.fogDensity.toFixed(3)}
        </label>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value={environment.fogDensity}
          onChange={(e) =>
            updateEnvironment({ fogDensity: parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Light Intensity */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Light Intensity: {environment.lightIntensity.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={environment.lightIntensity}
          onChange={(e) =>
            updateEnvironment({ lightIntensity: parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => updateEnvironment(presets[0].env)}
        className="w-full bg-white/10 hover:bg-white/20 py-2 rounded transition-colors"
      >
        Reset to Default
      </button>
    </div>
  )
}
