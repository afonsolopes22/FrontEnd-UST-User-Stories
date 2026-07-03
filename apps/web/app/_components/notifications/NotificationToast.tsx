'use client'

import { useEffect } from 'react'
import { useNotifications } from '@/app/_context/NotificationsContext'
import styles from './NotificationToast.module.css'

const AUTO_DISMISS_MS = 5000

export default function NotificationToast() {
  const { pendingToasts, dismissToast } = useNotifications()

  if (pendingToasts.length === 0) return null

  return (
    <div className={styles.toastStack}>
      {pendingToasts.map(toast => (
        <ToastCard key={toast.toastId} toastId={toast.toastId} message={toast.message} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

function ToastCard({ toastId, message, onDismiss }: { toastId: string; message: string; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toastId), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toastId, onDismiss])

  return (
    <div className={styles.toastCard} onClick={() => onDismiss(toastId)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      <span className={styles.toastMessage}>{message}</span>
    </div>
  )
}
