'use client'

import styles from '../settings/settings.module.css'
import { useNotifications } from '@/app/_context/NotificationsContext'

export default function NotificationsPage() {
  const { notifications, markAllRead, markRead } = useNotifications()

  return (
    <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr', padding: '2rem' }}>
      <div className={styles.formCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 className={styles.formTitle}>Notifications</h2>
            <p className={styles.formSubtitle}>Alerts for team membership and platform activity.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button className={styles.saveBtn} style={{ marginTop: 0 }} onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className={styles.placeholderDesc}>No notifications yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id) }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px',
                  background: n.read ? '#fafafa' : '#f0f9ff',
                  border: `1px solid ${n.read ? '#e5e7eb' : '#bae6fd'}`,
                  borderRadius: 8,
                  cursor: n.read ? 'default' : 'pointer',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={n.read ? '#9ca3af' : '#0284c7'}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: n.read ? '#6b7280' : '#0c4a6e', fontWeight: n.read ? 400 : 500 }}>
                    {n.message}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
