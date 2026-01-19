import React from 'react'

type FileInfo = { name: string; size: number; mtime: number }

interface FilesSectionProps {
  files: FileInfo[]
  onClearDownloads: () => void
}

export function FilesSection({ files, onClearDownloads }: FilesSectionProps) {
  return (
    <div className="files-container">
      <div className="download-header">
        <h2 className="download-title">Downloaded Files</h2>
        <button onClick={onClearDownloads} className="refresh-button">
          Clear Downloads
        </button>
      </div>
      <div className="files-grid">
        {files.length === 0 ? (
          <div className="empty-state">No files yet.</div>
        ) : (
          files.map((f) => (
            <a
              key={f.name}
              className="file-link"
              href={`/api/files/${encodeURIComponent(f.name)}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="file-item">
                <span className="file-name">{f.name}</span>
                <span className="file-size">{Math.round(f.size / 1024)} KB</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
