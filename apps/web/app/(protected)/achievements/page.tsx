'use client'

import { useState, useEffect } from 'react'
import { useAchievements } from '@/app/_context/AchievementsContext'
import { useAuth } from '@/app/_context/AuthContext'
import styles from './achievements.module.css'

type BackendAchievement = {
    id: number
    name: string
    description: string
    requirement: string
    color: string
    text_color: string
    unlocked_emails: string[]
    auto_detectable: boolean
    metric_1: string | null
    comparator_1: string | null
    value_1: number | null
    metric_2: string | null
    comparator_2: string | null
    value_2: number | null
    count_required: number | null
}

const METRIC_OPTIONS = [
    { value: 'score', label: 'Score (%)' },
    { value: 'quality', label: 'Code quality (%)' },
    { value: 'failed_count', label: 'Failed criteria (count)' },
]
const COMPARATOR_OPTIONS = [
    { value: '>=', label: 'at least' },
    { value: '>', label: 'more than' },
    { value: '<=', label: 'at most' },
    { value: '<', label: 'less than' },
    { value: '==', label: 'exactly' },
]
const METRIC_LABEL: Record<string, string> = { score: 'score', quality: 'code quality', failed_count: 'failed criteria' }
const METRIC_UNIT: Record<string, string> = { score: '%', quality: '%', failed_count: '' }
const COMPARATOR_LABEL: Record<string, string> = { '>=': 'at least', '>': 'more than', '<=': 'at most', '<': 'less than', '==': 'exactly' }

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
    onEquip: (id: number) => void
    equipping: number | null
}) {
    const { id, name, description, requirement, color, text_color, auto_detectable } = achievement

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
            {!auto_detectable && (
                <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>
                    Manually granted by an admin — not auto-detected.
                </p>
            )}

            <button
                className={`${styles.equipBtn} ${isActive ? styles.equipBtnActive : ''}`}
                disabled={!unlocked || isActive || equipping === id}
                onClick={() => onEquip(id)}
            >
                {equipping === id ? 'Equipping…' : isActive ? 'Equipped' : 'Equip'}
            </button>
        </div>
    )
}

export default function AchievementsPage() {
    const { activeTag, setActiveTag, hideAchievements, setHideAchievements, refreshAchievements } = useAchievements()
    const { token, user } = useAuth()
    const [achievements, setAchievements] = useState<BackendAchievement[]>([])
    const [loading, setLoading] = useState(true)
    const [equipping, setEquipping] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const isAdmin = user?.role === 'admin'
    const [showAddForm, setShowAddForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [metric1, setMetric1] = useState('score')
    const [comparator1, setComparator1] = useState('>=')
    const [value1, setValue1] = useState('100')
    const [countRequired, setCountRequired] = useState('1')
    const [hasSecondCondition, setHasSecondCondition] = useState(false)
    const [metric2, setMetric2] = useState('quality')
    const [comparator2, setComparator2] = useState('>=')
    const [value2, setValue2] = useState('50')
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

    function buildPreview() {
        const v1 = parseFloat(value1)
        if (Number.isNaN(v1)) return ''
        let cond = `${COMPARATOR_LABEL[comparator1]} ${v1}${METRIC_UNIT[metric1]} ${METRIC_LABEL[metric1]}`
        if (hasSecondCondition) {
            const v2 = parseFloat(value2)
            if (!Number.isNaN(v2)) {
                cond += ` and ${COMPARATOR_LABEL[comparator2]} ${v2}${METRIC_UNIT[metric2]} ${METRIC_LABEL[metric2]}`
            }
        }
        const n = parseInt(countRequired, 10) || 1
        return `${n} ${n === 1 ? 'evaluation' : 'evaluations'} with ${cond}.`
    }

    function resetForm() {
        setNewName(''); setNewDescription('')
        setMetric1('score'); setComparator1('>='); setValue1('100'); setCountRequired('1')
        setHasSecondCondition(false); setMetric2('quality'); setComparator2('>='); setValue2('50')
        setNewColor('#5236ab'); setNewTextColor('#ffffff')
    }

    async function handleCreateAchievement() {
        if (!newName.trim() || !newDescription.trim()) {
            setSaveError('Name and description are required.')
            return
        }
        const v1 = parseFloat(value1)
        if (Number.isNaN(v1)) {
            setSaveError('The condition value must be a number.')
            return
        }
        const n = parseInt(countRequired, 10)
        if (Number.isNaN(n) || n < 1) {
            setSaveError('Number of evaluations must be at least 1.')
            return
        }
        setSaving(true)
        setSaveError(null)
        try {
            const payload: Record<string, unknown> = {
                name: newName.trim(),
                description: newDescription.trim(),
                metric_1: metric1,
                comparator_1: comparator1,
                value_1: v1,
                count_required: n,
                color: newColor,
                text_color: newTextColor,
            }
            if (hasSecondCondition) {
                const v2 = parseFloat(value2)
                if (Number.isNaN(v2)) {
                    setSaveError('The second condition value must be a number.')
                    setSaving(false)
                    return
                }
                payload.metric_2 = metric2
                payload.comparator_2 = comparator2
                payload.value_2 = v2
            }

            const res = await fetch('/api/achievements/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                setSaveError(data?.error ?? 'Failed to create achievement.')
                return
            }
            resetForm()
            setShowAddForm(false)
            loadAchievements()
            refreshAchievements()
        } catch {
            setSaveError('Unexpected error.')
        } finally {
            setSaving(false)
        }
    }

    const handleEquip = async (id: number) => {
        setEquipping(id)
        setError(null)
        try {
            await setActiveTag(String(id))
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

    const visible = achievements
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
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, overflowY: 'auto' }}
                    onClick={() => !saving && setShowAddForm(false)}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Add a new achievement</h2>
                        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
                            Unlocks automatically once a member&apos;s evaluations meet the criteria below.
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

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Condition</label>
                        <div style={{ display: 'flex', gap: 8, margin: '4px 0 8px', flexWrap: 'wrap' }}>
                            <select value={metric1} onChange={e => setMetric1(e.target.value)}
                                    style={{ flex: '1 1 150px', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                                {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={comparator1} onChange={e => setComparator1(e.target.value)}
                                    style={{ flex: '1 1 110px', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                                {COMPARATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <input
                                type="number"
                                value={value1}
                                onChange={e => setValue1(e.target.value)}
                                style={{ width: 90, padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                            />
                        </div>

                        {!hasSecondCondition ? (
                            <button
                                onClick={() => setHasSecondCondition(true)}
                                style={{ background: 'none', border: 'none', color: '#5236ab', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 0 12px' }}
                            >
                                + Add another condition (AND)
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: 8, margin: '0 0 12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>and</span>
                                <select value={metric2} onChange={e => setMetric2(e.target.value)}
                                        style={{ flex: '1 1 150px', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                                    {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <select value={comparator2} onChange={e => setComparator2(e.target.value)}
                                        style={{ flex: '1 1 110px', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                                    {COMPARATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <input
                                    type="number"
                                    value={value2}
                                    onChange={e => setValue2(e.target.value)}
                                    style={{ width: 90, padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                                />
                                <button
                                    onClick={() => setHasSecondCondition(false)}
                                    title="Remove condition"
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Number of evaluations required</label>
                        <input
                            type="number"
                            min={1}
                            value={countRequired}
                            onChange={e => setCountRequired(e.target.value)}
                            style={{ width: 90, margin: '4px 0 12px', padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, display: 'block' }}
                        />

                        <div style={{
                            padding: '8px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #eee',
                            fontSize: 12, color: '#374151', marginBottom: 12,
                        }}>
                            <strong>Preview:</strong> {buildPreview() || '—'}
                        </div>

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
                        isActive={activeTag === String(a.id)}
                        onEquip={handleEquip}
                        equipping={equipping}
                    />
                ))}
            </div>
        </div>
    )
}