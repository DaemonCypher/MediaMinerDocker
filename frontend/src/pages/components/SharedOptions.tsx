import React from 'react'

interface SharedOptionsProps {
  allowPlaylist: boolean
  playlistItems: string
  cookieText: string
  onAllowPlaylistChange: (allow: boolean) => void
  onPlaylistItemsChange: (items: string) => void
  onCookieTextChange: (cookies: string) => void
}

export function SharedOptions({
  allowPlaylist,
  playlistItems,
  cookieText,
  onAllowPlaylistChange,
  onPlaylistItemsChange,
  onCookieTextChange,
}: SharedOptionsProps) {
  return (
    <>
      <label
        className="checkbox-row checkbox-row-top checkbox-row-switch"
        title="Toggle on to allow playlist/channel downloads; off forces single URL only"
      >
        <input
          type="checkbox"
          checked={allowPlaylist}
          onChange={e => onAllowPlaylistChange(e.target.checked)}
          title="Toggle playlist support"
        />
        <span>allow_playlist</span>
      </label>

      <label
        className="form-label"
        title="Limit playlist to specific 1-based items or ranges; examples: 1-5,7,10-12"
      >
        Playlist Items (optional, e.g. 1-10)
      </label>
      <input
        className="input-control"
        value={playlistItems}
        onChange={e => onPlaylistItemsChange(e.target.value)}
        placeholder="1-10"
        title="Comma and range list like 1-5,7,10-12"
      />
      <div className="form-hint">Use 1-based positions or ranges (e.g., 1-5,7,10-12)</div>

      <label
        className="form-label"
        title="Paste cookies.txt content to access private, age-gated, or region-locked videos"
      >
        Cookies (optional, paste raw cookie text)
      </label>
      <textarea
        className="input-control"
        value={cookieText}
        onChange={e => onCookieTextChange(e.target.value)}
        placeholder="Paste cookies in Netscape format"
        rows={3}
        title="Use exported cookies.txt (Netscape format) when authentication is needed"
      />
    </>
  )
}
