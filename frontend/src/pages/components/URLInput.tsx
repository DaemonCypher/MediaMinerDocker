import React from 'react'
import { Metadata } from '../services/downloadService'

interface URLInputProps {
  url: string
  onUrlChange: (url: string) => void
  onPreview: () => void
  fetchingMetadata: boolean
  busy: boolean
}

export function URLInput({ url, onUrlChange, onPreview, fetchingMetadata, busy }: URLInputProps) {
  return (
    <div>
      <label className="form-label">URL</label>
      <div className="input-row">
        <input
          className="input-control"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          placeholder="https://youtu.be/..."
          disabled={fetchingMetadata || busy}
        />
        <button
          onClick={onPreview}
          disabled={fetchingMetadata || !url.trim() || busy}
          className="primary-button button-preview"
        >
          {fetchingMetadata ? 'Searching...' : 'Preview'}
        </button>
      </div>
    </div>
  )
}
