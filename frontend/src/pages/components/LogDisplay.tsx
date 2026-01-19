import React, { useEffect, useRef } from 'react'
import './styles/LogDisplay.css'

interface LogDisplayProps {
  log: string
  busy: boolean
}

export function LogDisplay({ log, busy }: LogDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && busy) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log, busy])

  if (!busy) return null

  return (
    <div className="log-card">
      <h2 className="log-title">Download Log</h2>
      <div ref={scrollRef} className="log-content">
        {log || '(no log yet)'}
      </div>
    </div>
  )
}
