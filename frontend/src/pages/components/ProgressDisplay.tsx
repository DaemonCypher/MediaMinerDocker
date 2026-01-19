import React from 'react'
import './styles/ProgressDisplay.css'

interface ProgressDisplayProps {
  busy: boolean
  currentProgress: string
  activeJobId: string | null
  onStop: () => void
}

export function ProgressDisplay({ busy, currentProgress, activeJobId, onStop }: ProgressDisplayProps) {
  if (!busy || !currentProgress) return null

  return (
    <div className="log-card progress-card">
      <div className="progress-header">
        <h2 className="log-title">
          Download Progress
        </h2>
        <button
          onClick={onStop}
          className="progress-stop-button"
        >
          Stop Download
        </button>
      </div>
      <div className="progress-display">{currentProgress}</div>
    </div>
  )
}
