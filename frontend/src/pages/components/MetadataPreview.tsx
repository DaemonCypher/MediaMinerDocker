import React from 'react'
import './styles/MetadataPreview.css'
import { Metadata } from '../services/downloadService'

interface MetadataPreviewProps {
  metadata: Metadata | null
  customTitle: string
  customArtist: string
  customYear: string
  customAlbum: string
  customGenre: string
  onCustomTitleChange: (title: string) => void
  onCustomArtistChange: (artist: string) => void
  onCustomYearChange: (year: string) => void
  onCustomAlbumChange: (album: string) => void
  onCustomGenreChange: (genre: string) => void
}

export function MetadataPreview({
  metadata,
  customTitle,
  customArtist,
  customYear,
  customAlbum,
  customGenre,
  onCustomTitleChange,
  onCustomArtistChange,
  onCustomYearChange,
  onCustomAlbumChange,
  onCustomGenreChange,
}: MetadataPreviewProps) {
  React.useEffect(() => {
    console.log('MetadataPreview rendered with metadata:', metadata)
  }, [metadata])

  if (!metadata)
    return (
      <div className="metadata-empty-state">
        Click Preview to load metadata and customize title, artist, year, album, and genre before downloading.
      </div>
    )

  const displayTitle = customTitle || metadata.title
  const displayArtist = customArtist || metadata.uploader || metadata.artist

  return (
    <div className="metadata-preview">
      <div className="metadata-content">
        {metadata.thumbnail && (
          <img src={metadata.thumbnail} alt="Thumbnail" className="metadata-thumbnail" />
        )}
        <div className="metadata-text">
          <div className="metadata-title-input-wrapper">
            <label htmlFor="custom-title" className="metadata-title-label">Filename (optional)</label>
            <input
              id="custom-title"
              type="text"
              value={customTitle}
              onChange={e => onCustomTitleChange(e.target.value)}
              placeholder={metadata.title}
              className="metadata-title-input"
              title="Leave empty to use original media title as filename"
            />
          </div>
          <div className="metadata-title">{displayTitle}</div>
          {displayArtist && <div className="metadata-uploader">{displayArtist}</div>}
          {metadata.duration && (
            <div className="metadata-duration">
              Duration: {Math.floor(metadata.duration / 60)}:{String(metadata.duration % 60).padStart(2, '0')}
            </div>
          )}
          <div className="metadata-field-group">
            <div className="metadata-field-wrapper">
              <label htmlFor="custom-artist" className="metadata-field-label">Artist</label>
              <input
                id="custom-artist"
                type="text"
                value={customArtist}
                onChange={e => onCustomArtistChange(e.target.value)}
                placeholder={metadata.artist || metadata.uploader || 'Unknown'}
                className="metadata-input"
              />
            </div>
            <div className="metadata-field-wrapper">
              <label htmlFor="custom-year" className="metadata-field-label">Year</label>
              <input
                id="custom-year"
                type="text"
                value={customYear}
                onChange={e => onCustomYearChange(e.target.value)}
                placeholder={metadata.year ? String(metadata.year) : 'YYYY'}
                className="metadata-input"
              />
            </div>
            <div className="metadata-field-wrapper">
              <label htmlFor="custom-album" className="metadata-field-label">Album</label>
              <input
                id="custom-album"
                type="text"
                value={customAlbum}
                onChange={e => onCustomAlbumChange(e.target.value)}
                placeholder={metadata.album || 'Unknown'}
                className="metadata-input"
              />
            </div>
            <div className="metadata-field-wrapper">
              <label htmlFor="custom-genre" className="metadata-field-label">Genre</label>
              <input
                id="custom-genre"
                type="text"
                value={customGenre}
                onChange={e => onCustomGenreChange(e.target.value)}
                placeholder={metadata.genre || 'Unknown'}
                className="metadata-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
