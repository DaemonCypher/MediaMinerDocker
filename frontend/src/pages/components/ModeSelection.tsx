import React from 'react'

interface ModeSelectionProps {
  url: string
  mode: string | null
  onModeSelect: (mode: 'audio' | 'video') => void
  busy: boolean
}

export function ModeSelection({ url, mode, onModeSelect, busy }: ModeSelectionProps) {
  if (!url.trim()) return null

  return (
    <div className="button-row">
      <button
        onClick={() => onModeSelect('audio')}
        className={`primary-button button-mode ${mode === 'audio' ? 'active' : ''}`}
        disabled={busy}
      >
        Download Audio
      </button>
      <button
        onClick={() => onModeSelect('video')}
        className={`primary-button button-mode ${mode === 'video' ? 'active' : ''}`}
        disabled={busy}
      >
        Download Video
      </button>
    </div>
  )
}
