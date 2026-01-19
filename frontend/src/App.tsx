import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import DownloadsPage from './pages/DownloadsPage'
import LogPage from './pages/LogPage'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/logs" element={<LogPage />} />
      </Routes>
    </div>
  )
}
