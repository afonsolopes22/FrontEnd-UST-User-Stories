'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from '@/app/_context/AuthContext'

export type AppNotification = {
  id: number
  message: string
  read: boolean
  timestamp: string
}

export type PendingToast = {
  toastId: string
  message: string
}

type NotificationsContextType = {
  notifications: AppNotification[]
  unreadCount: number
  pendingToasts: PendingToast[]
  dismissToast: (toastId: string) => void
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

const POLL_INTERVAL_MS = 20000

type RawNotification = { id: number; message: string; read: boolean; created_at: string }

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [pendingToasts, setPendingToasts] = useState<PendingToast[]>([])
  const seenIds = useRef<Set<number> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data: RawNotification[] = await res.json()
      if (!Array.isArray(data)) return

      const mapped: AppNotification[] = data.map(n => ({
        id: n.id, message: n.message, read: n.read, timestamp: n.created_at,
      }))
      setNotifications(mapped)

      if (seenIds.current === null) {
        // First load: just establish the baseline, no toast spam for pre-existing notifications.
        seenIds.current = new Set(mapped.map(n => n.id))
      } else {
        const fresh = mapped.filter(n => !seenIds.current!.has(n.id))
        if (fresh.length > 0) {
          fresh.forEach(n => seenIds.current!.add(n.id))
          setPendingToasts(prev => [
            ...prev,
            ...fresh.map(n => ({ toastId: `${n.id}_${Date.now()}`, message: n.message })),
          ])
        }
      }
    } catch {}
  }, [token])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, fetchNotifications])

  const dismissToast = useCallback((toastId: string) => {
    setPendingToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  const markRead = useCallback(async (id: number) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    if (!token) return
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    } catch {}
  }, [token])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (!token) return
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    } catch {}
  }, [token])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, pendingToasts, dismissToast, markRead, markAllRead, refresh: fetchNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider')
  return ctx
}
