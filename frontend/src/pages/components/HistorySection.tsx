import React from 'react'
import { DownloadHistoryEntry } from '../../utils/historyStore'

interface HistorySectionProps {
  history: DownloadHistoryEntry[]
  onClearHistory: () => void
  onRedownload: (entry: DownloadHistoryEntry) => void
  onRemove: (id: string) => void
}

export function HistorySection({ history, onClearHistory, onRedownload, onRemove }: HistorySectionProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <>
      <div className="files-container" style={{ marginTop: 0 }}>
        <div className="download-header">
          <h2 className="download-title">Download History</h2>
          {history.length > 0 && (
            <button onClick={onClearHistory} className="refresh-button">
              Clear History
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="jobs-page__empty">
          <p className="empty-state-text">No download history yet. Start a download to see it here.</p>
        </div>
      ) : (
        <div className="jobs-page__grid">
          {history.map((entry) => (
            <div key={entry.id} className="jobs-card">
              <div className="jobs-card__header">
                <div className="history-entry-header">
                  {entry.thumbnail && (
                    <img src={entry.thumbnail} alt="Thumbnail" className="history-thumbnail" />
                  )}
                  <div className="history-content">
                    <h3 className="history-title">{entry.title || entry.url.substring(0, 50)}</h3>
                    <div className="history-meta">
                      {entry.mode === 'audio' ? (
                        <>Audio • {entry.format} • {entry.bitrate}kbps</>
                      ) : (
                        <>Video • {entry.container} • {entry.height}p • {entry.codec || 'default'}</>
                      )}
                    </div>
                    <div className="history-timestamp">{formatDate(entry.timestamp)}</div>
                  </div>
                </div>
              </div>
              <div className="button-row">
                <button onClick={() => onRedownload(entry)} className="button-redownload">
                  Download Again
                </button>
                <button onClick={() => onRemove(entry.id)} className="button-remove">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
