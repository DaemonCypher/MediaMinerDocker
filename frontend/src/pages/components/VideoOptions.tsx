import React from 'react'

interface VideoOptionsProps {
  container: string
  height: '720' | '1080' | '1440' | '2160' | 'none'
  codec: string
  onContainerChange: (container: string) => void
  onHeightChange: (height: '720' | '1080' | '1440' | '2160' | 'none') => void
  onCodecChange: (codec: string) => void
}

export function VideoOptions({
  container,
  height,
  codec,
  onContainerChange,
  onHeightChange,
  onCodecChange,
}: VideoOptionsProps) {
  return (
    <>
      <label className="form-label form-label-top" title="Select the video container/extension">Media Type</label>
      <select
        className="select-control"
        value={container}
        onChange={e => onContainerChange(e.target.value)}
        title="mp4 is most compatible; mkv/webm can support more codecs"
      >
        <option value="mp4">mp4</option>
        <option value="mkv">mkv</option>
        <option value="webm">webm</option>
      </select>

      <label className="form-label" title="Choose maximum video height (resolution)">Quality</label>
      <select
        className="select-control"
        value={height}
        onChange={e => onHeightChange(e.target.value as any)}
        title="Caps the resolution; 'Best Available' leaves it to the source"
      >
        <option value="720">720</option>
        <option value="1080">1080</option>
        <option value="1440">1440</option>
        <option value="2160">2160</option>
        <option value="none">Best Available</option>
      </select>

      <label className="form-label" title="Prefer a specific video codec if available">Prefer Codec</label>
      <select
        className="select-control"
        value={codec}
        onChange={e => onCodecChange(e.target.value)}
        title="Leave None for automatic; AV1/VP9/HEVC are efficient, H264 is widest support"
      >
        <option value="">None</option>
        <option value="h264">h264</option>
        <option value="hevc">hevc</option>
        <option value="vp9">vp9</option>
        <option value="av1">av1</option>
      </select>
    </>
  )
}
