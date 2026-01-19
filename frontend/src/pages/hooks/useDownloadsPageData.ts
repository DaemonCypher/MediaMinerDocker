import { useEffect, useState } from 'react'
import { getHistory, subscribeToHistory, DownloadHistoryEntry } from '../../utils/historyStore'

type FileInfo = { name: string; size: number; mtime: number }
type FilesResponse = { files: FileInfo[] }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail ?? 'Request failed')
  return data as T
}

export function useDownloadsPageData() {
  const [history, setHistory] = useState<DownloadHistoryEntry[]>(getHistory())
  const [files, setFiles] = useState<FileInfo[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToHistory(() => {
      setHistory(getHistory())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    refreshFiles()
  }, [])

  const refreshFiles = async () => {
    try {
      const data = await getJson<FilesResponse>('/api/files')
      const sorted = [...(data.files || [])].sort((a, b) => b.mtime - a.mtime)
      setFiles(sorted)
    } catch (err) {
      console.error('Failed to fetch files:', err)
    }
  }

  const clearDownloads = async () => {
    try {
      await fetch('/api/files', { method: 'DELETE' })
      setFiles([])
    } catch (err) {
      console.error('Failed to clear files:', err)
    }
  }

  return { history, files, refreshFiles, clearDownloads }
}
