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

    const isAdmin = user?.role === 'admin'
    const [showAddForm, setShowAddForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [newRequirement, setNewRequirement] = useState('')
    const [newColor, setNewColor] = useState('#5236ab')
    const [newTextColor, setNewTextColor] = useState('#ffffff')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const loadAchievements = () => {
        if (!token) return
        setLoading(true)
        fetch('/api/achievements/list', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setAchievements(data)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadAchievements()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    async function handleCreateAchievement() {
        if (!newName.trim() || !newDescription.trim() || !newRequirement.trim()) {
            setSaveError('Name, description and requirement are required.')
            return
        }
        setSaving(true)
        setSaveError(null)
        try {
            const res = await fetch('/api/achievements/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim(),
                    requirement: newRequirement.trim(),
                    color: newColor,
                    text_color: newTextColor,
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                setSaveError(data?.error ?? 'Failed to create achievement.')
                return
            }
            setNewName(''); setNewDescription(''); setNewRequirement('')
            setNewColor('#5236ab'); setNewTextColor('#ffffff')
            setShowAddForm(false)
            loadAchievements()
        } catch {
            setSaveError('Unexpected error.')
        } finally {
            setSaving(false)
        }
    }

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                                    fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6,
                                    border: 'none', background: '#5236ab', color: '#fff', cursor: 'pointer',
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add achievement
                            </button>
                        )}
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
            </div>

            {showAddForm && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => !saving && setShowAddForm(false)}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Add a new achievement</h2>
                        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
                            Members unlock it once you grant it to them (Users tab won&apos;t auto-unlock it).
                        </p>

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Name</label>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Perfectionist"
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
                        />

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Description</label>
                        <input
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            placeholder="Shown on the badge card"
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
                        />

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Requirement</label>
                        <input
                            value={newRequirement}
                            onChange={e => setNewRequirement(e.target.value)}
                            placeholder="e.g. Score 100% on 5 evaluations"
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
                        />

                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Badge color</label>
                                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                                       style={{ width: '100%', height: 34, marginTop: 4, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Text color</label>
                                <input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)}
                                       style={{ width: '100%', height: 34, marginTop: 4, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                            </div>
                        </div>

                        <span className={styles.badge} style={{ background: newColor, color: newTextColor }}>
              {newName || 'Preview'}
            </span>

                        {saveError && <p style={{ color: '#dc2626', fontSize: 12, margin: '12px 0 0' }}>{saveError}</p>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                            <button
                                onClick={() => setShowAddForm(false)}
                                disabled={saving}
                                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAchievement}
                                disabled={saving}
                                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#5236ab', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                {saving ? 'Saving…' : 'Save achievement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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