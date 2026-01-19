import React from 'react'

interface AudioOptionsProps {
  format: string
  bitrate: string
  onFormatChange: (format: string) => void
  onBitrateChange: (bitrate: string) => void
}

export function AudioOptions({ format, bitrate, onFormatChange, onBitrateChange }: AudioOptionsProps) {
  return (
    <>
      <label className="form-label form-label-top" title="Choose the output audio container/codec">Media Type</label>
      <select
        className="select-control"
        value={format}
        onChange={e => onFormatChange(e.target.value)}
        title="mp3/m4a are broadly compatible; opus/flac/wav offer higher quality"
      >
        <option value="mp3">mp3</option>
        <option value="m4a">m4a</option>
        <option value="opus">opus</option>
        <option value="flac">flac</option>
        <option value="wav">wav</option>
      </select>

      <label className="form-label" title="Pick target audio bitrate (kbps)">Quality</label>
      <select
        className="select-control"
        value={bitrate}
        onChange={e => onBitrateChange(e.target.value)}
        title="Higher kbps = larger files, better quality"
      >
        <option value="128">128</option>
        <option value="160">160</option>
        <option value="192">192</option>
        <option value="256">256</option>
        <option value="320">320</option>
      </select>
    </>
  )
}
