import { useEffect, useState } from 'react'

export type AudioOptions = {
  format: string
  bitrate: string
}

export type VideoOptions = {
  container: string
  height: '720' | '1080' | '1440' | '2160' | 'none'
  codec: string
}

export type DownloadState = {
  url: string
  metadata: any
  customTitle: string
  customArtist: string
  customYear: string
  customAlbum: string
  customGenre: string
  mode: 'audio' | 'video' | null
  fetchingMetadata: boolean
  audioOptions: AudioOptions
  videoOptions: VideoOptions
  allowPlaylist: boolean
  playlistItems: string
  cookieText: string
  busy: boolean
  activeJobId: string | null
  log: string
  currentProgress: string
}

const HOME_STATE_KEY = 'homePageState'

export function useHomePageState() {
  const [state, setState] = useState<DownloadState>({
    url: '',
    metadata: null,
    customTitle: '',
    customArtist: '',
    customYear: '',
    customAlbum: '',
    customGenre: '',
    mode: null,
    fetchingMetadata: false,
    audioOptions: { format: 'mp3', bitrate: '192' },
    videoOptions: { container: 'mp4', height: '1080', codec: '' },
    allowPlaylist: false,
    playlistItems: '',
    cookieText: '',
    busy: false,
    activeJobId: null,
    log: '',
    currentProgress: '',
  })

  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(HOME_STATE_KEY)
    if (!raw) {
      setHydrated(true)
      return
    }
    try {
      const saved = JSON.parse(raw)
      setState({
        url: saved.url ?? '',
        metadata: saved.metadata ?? null,
        customTitle: saved.customTitle ?? '',
        customArtist: saved.customArtist ?? '',
        customYear: saved.customYear ?? '',
        customAlbum: saved.customAlbum ?? '',
        customGenre: saved.customGenre ?? '',
        mode: saved.mode ?? null,
        fetchingMetadata: false,
        audioOptions: {
          format: saved.format ?? 'mp3',
          bitrate: saved.bitrate ?? '192',
        },
        videoOptions: {
          container: saved.container ?? 'mp4',
          height: saved.height ?? '1080',
          codec: saved.codec ?? '',
        },
        allowPlaylist: saved.allowPlaylist ?? false,
        playlistItems: saved.playlistItems ?? '',
        cookieText: saved.cookieText ?? '',
        busy: saved.busy ?? false,
        activeJobId: saved.activeJobId ?? null,
        log: saved.log ?? '',
        currentProgress: saved.currentProgress ?? '',
      })
    } catch (e) {
      console.error('Failed to restore home state', e)
    } finally {
      setHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(HOME_STATE_KEY, JSON.stringify({
        url: state.url,
        metadata: state.metadata,
        customTitle: state.customTitle,
        customArtist: state.customArtist,
        customYear: state.customYear,
        customAlbum: state.customAlbum,
        customGenre: state.customGenre,
        mode: state.mode,
        format: state.audioOptions.format,
        bitrate: state.audioOptions.bitrate,
        container: state.videoOptions.container,
        height: state.videoOptions.height,
        codec: state.videoOptions.codec,
        allowPlaylist: state.allowPlaylist,
        playlistItems: state.playlistItems,
        cookieText: state.cookieText,
        activeJobId: state.activeJobId,
        busy: state.busy,
        log: state.log,
        currentProgress: state.currentProgress,
      }))
    } catch (e) {
      console.error('Failed to persist home state', e)
    }
  }, [hydrated, state])

  return { state, setState, hydrated }
}
