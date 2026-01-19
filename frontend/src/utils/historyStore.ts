export interface DownloadHistoryEntry {
  id: string
  url: string
  title: string
  thumbnail?: string
  timestamp: number
  mode: 'audio' | 'video'
  format?: string
  bitrate?: string
  container?: string
  height?: string
  codec?: string
  allowPlaylist?: boolean
  playlistItems?: string
  cookieText?: string
}

const HISTORY_KEY = 'download_history'
let subscribers: Array<() => void> = []

export function getHistory(): DownloadHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addToHistory(entry: Omit<DownloadHistoryEntry, 'id' | 'timestamp'>): void {
  const history = getHistory()
  const newEntry: DownloadHistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: Date.now(),
  }
  history.unshift(newEntry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  notifySubscribers()
}

export function removeFromHistory(id: string): void {
  const history = getHistory()
  const filtered = history.filter((entry) => entry.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  notifySubscribers()
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
  notifySubscribers()
}

export function subscribeToHistory(callback: () => void): () => void {
  subscribers.push(callback)
  return () => {
    subscribers = subscribers.filter((sub) => sub !== callback)
  }
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => callback())
}
