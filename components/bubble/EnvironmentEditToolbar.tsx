'use client'

import { useUIStore } from '@/stores/uiStore'
import { useBubbleStore } from '@/stores/bubbleStore'

export default function EnvironmentEditToolbar() {
  const {
    isEnvironmentEditMode,
    environmentEditTool,
    environmentEditTarget,
    setEnvironmentEditMode,
    setEnvironmentEditTool,
    setEnvironmentEditTarget,
    toggleEnvironmentEditor,
  } = useUIStore()
  const { saveEnvironment, environment } = useBubbleStore()

  if (!isEnvironmentEditMode) return null

  const handleDone = () => {
    saveEnvironment()
    setEnvironmentEditMode(false)
  }

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-3 border border-white/20 shadow-2xl flex items-center gap-3">
        {/* Tool selection */}
        <div className="flex items-center gap-1 border-r border-white/20 pr-3">
          <button
            onClick={() => setEnvironmentEditTool('picker')}
            className={`p-2 rounded-lg transition-colors ${
              environmentEditTool === 'picker'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/20'
            }`}
            title="Color Picker - Click on sky, ground, or fog to change colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
          <button
            onClick={() => setEnvironmentEditTool('sampler')}
            className={`p-2 rounded-lg transition-colors ${
              environmentEditTool === 'sampler'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/20'
            }`}
            title="Color Sampler - Click on any node to sample its color"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Sampler target selection */}
        {environmentEditTool === 'sampler' && (
          <div className="flex items-center gap-1 border-r border-white/20 pr-3">
            <span className="text-white/40 text-xs mr-1">Apply to:</span>
            <button
              onClick={() => setEnvironmentEditTarget('sky')}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                environmentEditTarget === 'sky'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: environment.skyColor }}
              />
              Sky
            </button>
            <button
              onClick={() => setEnvironmentEditTarget('ground')}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                environmentEditTarget === 'ground'
                  ? 'bg-green-500 text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: environment.groundColor }}
              />
              Ground
            </button>
            <button
              onClick={() => setEnvironmentEditTarget('fog')}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                environmentEditTarget === 'fog'
                  ? 'bg-orange-500 text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: environment.fogColor }}
              />
              Fog
            </button>
          </div>
        )}

        {/* Mode indicator */}
        <div className="text-white/60 text-sm px-2">
          {environmentEditTool === 'picker' && 'Click sky, ground, or horizon to edit'}
          {environmentEditTool === 'sampler' && !environmentEditTarget && 'Select a target, then click any node'}
          {environmentEditTool === 'sampler' && environmentEditTarget && `Click a node to apply color to ${environmentEditTarget}`}
        </div>

        {/* Advanced panel toggle */}
        <button
          onClick={() => {
            setEnvironmentEditMode(false)
            toggleEnvironmentEditor()
          }}
          className="text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm transition-colors"
        >
          Advanced
        </button>

        {/* Done button */}
        <button
          onClick={handleDone}
          className="bg-white text-black px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
