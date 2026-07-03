'use client'

import { useState, useEffect } from 'react'
import { useAchievements } from '@/app/_context/AchievementsContext'
import { useAuth } from '@/app/_context/AuthContext'
import type { AchievementId } from '@/lib/achievements'
import styles from './achievements.module.css'

type BackendAchievement = {
  id: number
  name: string
  description: string
  requirement: string
  color: string
  text_color: string
  unlocked_emails: string[]
}

// Maps backend achievement names to local equip IDs
const NAME_TO_ID: Record<string, AchievementId> = {
  'Newbie': 'NEWBIE',
  'Bullseye': 'BULLSEYE',
  'The Sniper': 'THE_SNIPER',
  'Batman': 'BATMAN',
  'Ghost': 'GHOST',
  'Unlucky': 'UNLUCKY',
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function AchievementCard({
  achievement,
  unlocked,
  isActive,
  onEquip,
  equipping,
}: {
  achievement: BackendAchievement
  unlocked: boolean
  isActive: boolean
  onEquip: (id: AchievementId) => void
  equipping: AchievementId | null
}) {
  const { name, description, requirement, color, text_color } = achievement
  const localId = NAME_TO_ID[name]

  return (
    <div
      className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}
      style={unlocked ? { borderLeftColor: color } : undefined}
    >
      {!unlocked && (
        <div className={styles.lockOverlay}>
          <LockIcon />
        </div>
      )}

      <div className={styles.cardHeader}>
        <span
          className={styles.badge}
          style={unlocked ? { background: color, color: text_color } : undefined}
        >
          {name}
        </span>
        {isActive && (
          <span className={styles.equippedPill}>Equipped</span>
        )}
      </div>

      <p className={styles.description}>{description}</p>

      <div className={styles.requirementRow}>
        <span className={styles.requirementLabel}>Requirement</span>
        <span className={styles.requirementText}>{requirement}</span>
      </div>

      {localId && (
        <button
          className={`${styles.equipBtn} ${isActive ? styles.equipBtnActive : ''}`}
          disabled={!unlocked || isActive || equipping === localId}
          onClick={() => onEquip(localId)}
        >
          {equipping === localId ? 'Equipping…' : isActive ? 'Equipped' : 'Equip'}
        </button>
      )}
    </div>
  )
}

export default function AchievementsPage() {
  const { activeTag, setActiveTag, hideAchievements, setHideAchievements } = useAchievements()
  const { token, user } = useAuth()
  const [achievements, setAchievements] = useState<BackendAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [equipping, setEquipping] = useState<AchievementId | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch('/api/achievements/list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAchievements(data)
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleEquip = async (id: AchievementId) => {
    setEquipping(id)
    setError(null)
    try {
      await setActiveTag(id)
    } catch {
      setError('Failed to equip tag. Please try again.')
    } finally {
      setEquipping(null)
    }
  }

  const isUnlocked = (a: BackendAchievement) =>
    !!user?.email && a.unlocked_emails.includes(user.email)

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingMsg}>Loading achievements…</div>
      </div>
    )
  }

  const visible = achievements.filter(a => a.name !== 'Newbie')
  const unlocked = visible.filter(isUnlocked)
  const locked = visible.filter(a => !isUnlocked(a))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className={styles.title}>Achievements</h1>
            <p className={styles.subtitle}>
              Unlock tags by meeting the criteria and equip the one you like most.
              <span className={styles.statsChip}>{unlocked.length} / {visible.length} unlocked</span>
            </p>
          </div>
          <button
            onClick={() => setHideAchievements(!hideAchievements)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid #e5e7eb',
              background: hideAchievements ? '#fef2f2' : '#f0fdf4',
              color: hideAchievements ? '#dc2626' : '#15803d',
              whiteSpace: 'nowrap',
            }}
            title={hideAchievements ? 'Show achievements in navbar and user tag' : 'Hide achievements from navbar and user tag'}
          >
            {hideAchievements ? '👁 Show achievements UI' : '🙈 Hide achievements UI'}
          </button>
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.grid}>
        {[...unlocked, ...locked].map(a => (
          <AchievementCard
            key={a.id}
            achievement={a}
            unlocked={isUnlocked(a)}
            isActive={activeTag === NAME_TO_ID[a.name] && activeTag !== 'NEWBIE'}
            onEquip={handleEquip}
            equipping={equipping}
          />
        ))}
      </div>
    </div>
  )
}
