'use client'

import { useState } from 'react'
import { useBubbleStore } from '@/stores/bubbleStore'

interface BucketCreationFormProps {
  isOpen: boolean
  onClose: () => void
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

export default function BucketCreationForm({ isOpen, onClose }: BucketCreationFormProps) {
  const { addBucket } = useBubbleStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter a bucket name')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Generate a random position near the center
      const position_x = (Math.random() - 0.5) * 10
      const position_y = 1.5 + Math.random() * 2
      const position_z = (Math.random() - 0.5) * 10

      const response = await fetch('/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          position_x,
          position_y,
          position_z,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create bucket')
      }

      const { bucket } = await response.json()

      // Add to store with empty nodes array
      addBucket({ ...bucket, nodes: [] })

      // Reset form and close
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[0])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-black/95 backdrop-blur-md rounded-lg w-full max-w-md border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create New Bucket</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Bucket Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bucket name..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this bucket for?"
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === presetColor ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
              {/* Custom color input */}
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-white/60 text-xs"
                  style={!PRESET_COLORS.includes(color) ? { backgroundColor: color, borderStyle: 'solid' } : {}}
                >
                  {PRESET_COLORS.includes(color) ? '+' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-white/60 text-xs mb-2">Preview</label>
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '40' }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              <div>
                <div className="text-white font-medium">{name || 'Bucket Name'}</div>
                {description && (
                  <div className="text-white/60 text-sm truncate max-w-48">{description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Bucket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
