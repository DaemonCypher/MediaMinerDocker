import React, { useEffect } from 'react'
import './styles/HomePage.css'
import { appendToJobLog, setActiveJobId } from '../utils/jobStore'
import { addToHistory } from '../utils/historyStore'
import { useHomePageState } from './hooks/useHomePageState'
import { postJson, getJson, formatLine, wsUrlFor, Metadata } from './services/downloadService'
import { URLInput } from './components/URLInput'
import { MetadataPreview } from './components/MetadataPreview'
import { ModeSelection } from './components/ModeSelection'
import { AudioOptions } from './components/AudioOptions'
import { VideoOptions } from './components/VideoOptions'
import { SharedOptions } from './components/SharedOptions'
import { ProgressDisplay } from './components/ProgressDisplay'
import { Notification } from '../components/Notification'

export default function HomePage() {
  const { state, setState, hydrated } = useHomePageState()
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const appendLog = (line: string) => {
    setState((prev) => {
      const newLog = (prev.log + line + '\n').slice(-30000)
      appendToJobLog(line, prev.activeJobId)
      return { ...prev, log: newLog }
    })
  }

  const updateProgress = (ev: any) => {
    if (ev.type === 'progress') {
      const parts = [ev.status, ev.percent, ev.speed, ev.eta ? `ETA: ${ev.eta}` : ''].filter(Boolean)
      setState((prev) => ({ ...prev, currentProgress: parts.join(' ') }))
    } else if (ev.type === 'status' && ev.status === 'finished') {
      setState((prev) => ({ ...prev, currentProgress: 'Download complete!' }))
    } else if (ev.type === 'error') {
      setState((prev) => ({ ...prev, currentProgress: `Error: ${ev.message}` }))
    }
  }

  const refreshFiles = async () => {
    const data = await getJson<{ files: any[] }>('/api/files')
  }

  let wsRef: WebSocket | null = null

  const stopDownload = async () => {
    if (!state.activeJobId) return

    try {
      // Close WebSocket
      if (wsRef) {
        wsRef.close()
        wsRef = null
      }

      // Call stop API
      await fetch(`/api/jobs/${state.activeJobId}/stop`, { method: 'POST' })
      appendLog(`Stopped job ${state.activeJobId}`)
    } catch (e: any) {
      appendLog(`ERROR stopping download: ${e.message}`)
    } finally {
      setActiveJobId(null)
      setState({
        ...state,
        busy: false,
        activeJobId: null,
        currentProgress: 'Download stopped',
      })
    }
  }

  const startWS = (jobId: string) => {
    setActiveJobId(jobId)
    setState((prev) => ({ ...prev, activeJobId: jobId, busy: true }))
    wsRef = new WebSocket(wsUrlFor(jobId))

    let keepAlive: number | undefined

    wsRef.onopen = () => {
      appendLog(`WS connected for job ${jobId}`)
      keepAlive = window.setInterval(() => {
        if (wsRef && wsRef.readyState === WebSocket.OPEN) wsRef.send('ping')
      }, 1500)
    }

    wsRef.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        appendLog(formatLine(msg))
        updateProgress(msg)
        if ((msg.type === 'status' && msg.status === 'finished') || msg.status === 'finished') {
          refreshFiles().catch(() => {})
          setActiveJobId(null)
          setState((prev) => ({ ...prev, busy: false, activeJobId: null }))
          setNotification({ message: '✅ Download completed successfully!', type: 'success' })
          wsRef = null
        }
        if (msg.type === 'error') {
          setActiveJobId(null)
          setState((prev) => ({ ...prev, busy: false, activeJobId: null }))
          setNotification({ message: `❌ Error: ${msg.message}`, type: 'error' })
          wsRef = null
        }
      } catch {
        appendLog(String(e.data))
      }
    }

    wsRef.onclose = () => {
      appendLog('WS closed')
      if (keepAlive) window.clearInterval(keepAlive)
      setActiveJobId(null)
      wsRef = null
    }
  }

  const fetchMetadata = async () => {
    if (!state.url.trim()) return
    setState({ ...state, fetchingMetadata: true })
    try {
      console.log('Fetching metadata for URL:', state.url)
      const data = await getJson<Metadata>(`/api/metadata?url=${encodeURIComponent(state.url.trim())}`)
      console.log('Metadata fetched:', data)
      setState({ ...state, metadata: data, fetchingMetadata: false })
    } catch (e: any) {
      console.error('ERROR fetching metadata:', e)
      appendLog(`ERROR fetching metadata: ${e.message}`)
      setState({ ...state, fetchingMetadata: false })
    }
  }

  const startDownload = async () => {
    if (!state.url.trim() || !state.mode) return
    setState((prev) => ({ ...prev, busy: true, log: '' }))

    try {
      const basePayload = {
        url: state.url.trim(),
        allow_playlist: state.allowPlaylist,
        playlist_items: state.playlistItems.trim() || null,
        cookie_text: state.cookieText.trim() || null,
        custom_title: state.customTitle.trim() || null,
        custom_artist: state.customArtist.trim() || null,
        custom_year: state.customYear.trim() || null,
        custom_album: state.customAlbum.trim() || null,
        custom_genre: state.customGenre.trim() || null,
      }

      if (state.mode === 'audio') {
        const payload = {
          ...basePayload,
          audio_format: state.audioOptions.format,
          bitrate: state.audioOptions.bitrate,
        }
        const { job_id } = await postJson<{ job_id: string }>('/api/jobs/audio', payload)
        appendLog(`Created audio job ${job_id}`)
        addToHistory({
          url: state.url.trim(),
          mode: 'audio',
          format: state.audioOptions.format,
          bitrate: state.audioOptions.bitrate,
          allowPlaylist: state.allowPlaylist,
          playlistItems: state.playlistItems,
          cookieText: state.cookieText,
          title: state.metadata?.title,
          thumbnail: state.metadata?.thumbnail,
        })
        startWS(job_id)
      } else {
        const payload = {
          ...basePayload,
          container: state.videoOptions.container,
          max_height: state.videoOptions.height === 'none' ? null : parseInt(state.videoOptions.height, 10),
          prefer_codec: state.videoOptions.codec || null,
        }
        const { job_id } = await postJson<{ job_id: string }>('/api/jobs/video', payload)
        appendLog(`Created video job ${job_id}`)
        addToHistory({
          url: state.url.trim(),
          mode: 'video',
          container: state.videoOptions.container,
          height: state.videoOptions.height,
          codec: state.videoOptions.codec,
          allowPlaylist: state.allowPlaylist,
          playlistItems: state.playlistItems,
          cookieText: state.cookieText,
          title: state.metadata?.title,
          thumbnail: state.metadata?.thumbnail,
        })
        startWS(job_id)
      }
    } catch (e: any) {
      appendLog(`ERROR: ${e.message}`)
      setState((prev) => ({ ...prev, busy: false }))
    }
  }

  const reset = () => {
    setState({
      url: '',
      metadata: null,
      customTitle: '',      customArtist: '',
      customYear: '',
      customAlbum: '',
      customGenre: '',      mode: null,
      fetchingMetadata: false,
      audioOptions: { format: 'mp3', bitrate: '192' },
      videoOptions: { container: 'mp4', height: '1080', codec: '' },
      allowPlaylist: true,
      playlistItems: '',
      cookieText: '',
      busy: false,
      activeJobId: null,
      log: '',
      currentProgress: '',
    })
  }

  useEffect(() => {
    refreshFiles().catch(() => {})
  }, [])

  if (!hydrated) return null

  return (
    <div className="download-container">
      <div className="download-header">
        <div>
          <div className="download-subtitle">
            Enter URL, optionally preview, then select audio or video to download.
          </div>
        </div>
      </div>

      <div className="download-grid">
        <div className="download-card">
          <h2>Download Media</h2>

          <URLInput
            url={state.url}
            onUrlChange={(url) => setState({ ...state, url })}
            onPreview={fetchMetadata}
            fetchingMetadata={state.fetchingMetadata}
            busy={state.busy}
          />

          <MetadataPreview
            metadata={state.metadata}
            customTitle={state.customTitle}
            customArtist={state.customArtist}
            customYear={state.customYear}
            customAlbum={state.customAlbum}
            customGenre={state.customGenre}
            onCustomTitleChange={(customTitle) => setState({ ...state, customTitle })}
            onCustomArtistChange={(customArtist) => setState({ ...state, customArtist })}
            onCustomYearChange={(customYear) => setState({ ...state, customYear })}
            onCustomAlbumChange={(customAlbum) => setState({ ...state, customAlbum })}
            onCustomGenreChange={(customGenre) => setState({ ...state, customGenre })}
          />

          <ModeSelection
            url={state.url}
            mode={state.mode}
            onModeSelect={(mode) => setState({ ...state, mode })}
            busy={state.busy}
          />

          {state.mode === 'audio' && (
            <AudioOptions
              format={state.audioOptions.format}
              bitrate={state.audioOptions.bitrate}
              onFormatChange={(format) =>
                setState({ ...state, audioOptions: { ...state.audioOptions, format } })
              }
              onBitrateChange={(bitrate) =>
                setState({ ...state, audioOptions: { ...state.audioOptions, bitrate } })
              }
            />
          )}

          {state.mode === 'video' && (
            <VideoOptions
              container={state.videoOptions.container}
              height={state.videoOptions.height}
              codec={state.videoOptions.codec}
              onContainerChange={(container) =>
                setState({ ...state, videoOptions: { ...state.videoOptions, container } })
              }
              onHeightChange={(height) =>
                setState({ ...state, videoOptions: { ...state.videoOptions, height } })
              }
              onCodecChange={(codec) =>
                setState({ ...state, videoOptions: { ...state.videoOptions, codec } })
              }
            />
          )}

          {state.mode && (
            <>
              <SharedOptions
                allowPlaylist={state.allowPlaylist}
                playlistItems={state.playlistItems}
                cookieText={state.cookieText}
                onAllowPlaylistChange={(allowPlaylist) => setState({ ...state, allowPlaylist })}
                onPlaylistItemsChange={(playlistItems) => setState({ ...state, playlistItems })}
                onCookieTextChange={(cookieText) => setState({ ...state, cookieText })}
              />

              <div className="button-row">
                <button
                  disabled={state.busy}
                  onClick={startDownload}
                  className="primary-button button-download"
                >
                  {state.busy ? 'Downloading...' : 'Start Download'}
                </button>
                <button onClick={reset} className="primary-button button-clear">
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ProgressDisplay 
        busy={state.busy} 
        currentProgress={state.currentProgress}
        activeJobId={state.activeJobId}
        onStop={stopDownload}
      />


      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={5000}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  )
}

