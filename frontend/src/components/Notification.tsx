import React, { useEffect } from 'react'
import './styles/Notification.css'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onDismiss: () => void
}

export function Notification({ message, type, duration = 5000, onDismiss }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  )
}
