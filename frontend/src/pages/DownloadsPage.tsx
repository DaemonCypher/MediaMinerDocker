import React from 'react'
import './styles/DownloadsPage.css'
import { removeFromHistory, clearHistory, DownloadHistoryEntry } from '../utils/historyStore'
import { useDownloadsPageData } from './hooks/useDownloadsPageData'
import { HistorySection } from './components/HistorySection'
import { FilesSection } from './components/FilesSection'

export default function DownloadsPage() {
  const { history, files, clearDownloads } = useDownloadsPageData()

  const redownload = (entry: DownloadHistoryEntry) => {
    // This would redirect to home and populate fields
    // For now, show URL in alert
    alert(`Would re-download: ${entry.url}`)
  }

  return (
    <div className="jobs-page">
      <HistorySection
        history={history}
        onClearHistory={clearHistory}
        onRedownload={redownload}
        onRemove={removeFromHistory}
      />

      <FilesSection files={files} onClearDownloads={clearDownloads} />
    </div>
  )
}
