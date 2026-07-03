'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/_context/AuthContext'
import styles from './faq.module.css'

type FaqItem = { q: string; a: React.ReactNode }

type FaqCategory = {
    label: string
    subtitle: string
    iconBg: string
    icon: React.ReactNode
    items: FaqItem[]
}

type RawFaq = { id: number; question: string; answer: string; category: string }

const CATEGORY_META: Record<string, { subtitle: string; iconBg: string; icon: React.ReactNode }> = {
    'Getting Started': {
        subtitle: 'New to DevLens? Start here.',
        iconBg: '#eff6ff',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        ),
    },
    'Analyze': {
        subtitle: 'Learn how analysis works and understand the results.',
        iconBg: '#f0fdf4',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    'User Stories': {
        subtitle: 'Manage and organize your user stories.',
        iconBg: '#f5f3ff',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    'Settings': {
        subtitle: 'Configure your workspace and preferences.',
        iconBg: '#fff7ed',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
        ),
    },
    'Security': {
        subtitle: 'Learn about security and data protection.',
        iconBg: '#fef2f2',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
    'Troubleshooting': {
        subtitle: 'Find solutions to common issues.',
        iconBg: '#f0fdf4',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    },
}

const CATEGORY_ORDER = Object.keys(CATEGORY_META)

const FALLBACK_META = {
    subtitle: 'Other questions.',
    iconBg: '#f3f4f6',
    icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
}

function groupByCategory(raw: RawFaq[]): FaqCategory[] {
    const byLabel = new Map<string, FaqItem[]>()
    for (const item of raw) {
        const list = byLabel.get(item.category) ?? []
        list.push({ q: item.question, a: item.answer })
        byLabel.set(item.category, list)
    }

    const labels = [
        ...CATEGORY_ORDER.filter(label => byLabel.has(label)),
        ...[...byLabel.keys()].filter(label => !CATEGORY_ORDER.includes(label)),
    ]

    return labels.map(label => {
        const meta = CATEGORY_META[label] ?? FALLBACK_META
        return { label, subtitle: meta.subtitle, iconBg: meta.iconBg, icon: meta.icon, items: byLabel.get(label) ?? [] }
    })
}

function ChevronDown({ open }: { open: boolean }) {
    return (
        <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ''}`}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

export default function FaqPage() {
    const { token, user } = useAuth()
    const [faqData, setFaqData] = useState<FaqCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [activeCat, setActiveCat] = useState(0)
    const [openItem, setOpenItem] = useState<number | null>(0)
    const [search, setSearch] = useState('')

    const isAdmin = user?.role === 'admin'
    const [showAddForm, setShowAddForm] = useState(false)
    const [newQuestion, setNewQuestion] = useState('')
    const [newAnswer, setNewAnswer] = useState('')
    const [newCategory, setNewCategory] = useState(CATEGORY_ORDER[0])
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const loadFaqs = () => {
        if (!token) return
        setLoading(true)
        setError(null)
        fetch('/api/faqs', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load FAQs'))))
            .then((items: RawFaq[]) => setFaqData(groupByCategory(items)))
            .catch(() => setError('Could not load FAQs. Please try again later.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadFaqs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    async function handleCreateFaq() {
        if (!newQuestion.trim() || !newAnswer.trim()) {
            setSaveError('Question and answer are required.')
            return
        }
        setSaving(true)
        setSaveError(null)
        try {
            const res = await fetch('/api/faqs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ question: newQuestion.trim(), answer: newAnswer.trim(), category: newCategory }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                setSaveError(data?.error ?? 'Failed to create FAQ.')
                return
            }
            setNewQuestion('')
            setNewAnswer('')
            setShowAddForm(false)
            loadFaqs()
        } catch {
            setSaveError('Unexpected error.')
        } finally {
            setSaving(false)
        }
    }

    const query = search.toLowerCase().trim()

    const searchResults: { catIdx: number; itemIdx: number; cat: FaqCategory; item: FaqItem }[] = query
        ? faqData.flatMap((cat, ci) =>
            cat.items
                .map((item, ii) => ({ catIdx: ci, itemIdx: ii, cat, item }))
                .filter(({ item }) =>
                    item.q.toLowerCase().includes(query) ||
                    (typeof item.a === 'string' && item.a.toLowerCase().includes(query))
                )
        )
        : []

    function selectCat(i: number) {
        setActiveCat(i)
        setOpenItem(0)
        setSearch('')
    }

    const cat = faqData[activeCat]
    const otherCats = faqData.filter((_, i) => i !== activeCat)

    return (
        <div className={styles.page}>

            {/* Top bar */}
            <div className={styles.topBar}>
                <div>
                    <h1 className={styles.pageTitle}>Frequently Asked Questions</h1>
                    <p className={styles.pageSubtitle}>Find answers to common questions about DevLens and how to get the most out of it.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search for answers..."
                            className={styles.search}
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                                fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 8,
                                border: 'none', background: '#5236ab', color: '#fff', cursor: 'pointer',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add FAQ
                        </button>
                    )}
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
                        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Add a new FAQ</h2>
                        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>Visible to everyone once created.</p>

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Category</label>
                        <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                        >
                            {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Question</label>
                        <input
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                            placeholder="e.g. How do I connect Azure DevOps?"
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
                        />

                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Answer</label>
                        <textarea
                            value={newAnswer}
                            onChange={e => setNewAnswer(e.target.value)}
                            rows={4}
                            placeholder="Write a clear, helpful answer..."
                            style={{ width: '100%', margin: '4px 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
                        />

                        {saveError && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 10px' }}>{saveError}</p>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={() => setShowAddForm(false)}
                                disabled={saving}
                                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFaq}
                                disabled={saving}
                                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#5236ab', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                {saving ? 'Saving…' : 'Save FAQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className={styles.content}>
                    <p className={styles.noResults}>Loading FAQs…</p>
                </div>
            ) : error ? (
                <div className={styles.content}>
                    <p className={styles.noResults}>{error}</p>
                </div>
            ) : query ? (
                <div className={styles.content}>
                    {searchResults.length === 0 ? (
                        <p className={styles.noResults}>No results for &ldquo;{search}&rdquo;.</p>
                    ) : (
                        <div className={styles.catPanel}>
                            <div className={styles.catPanelHeader}>
                                <div>
                                    <p className={styles.catPanelName}>Search results for &ldquo;{search}&rdquo;</p>
                                    <p className={styles.catPanelSub}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</p>
                                </div>
                            </div>
                            {searchResults.map(({ catIdx, itemIdx, cat: c, item }) => {
                                const key = `${catIdx}-${itemIdx}`
                                const isOpen = openItem === catIdx * 100 + itemIdx
                                return (
                                    <div key={key} className={styles.accordionItem}>
                                        <button
                                            className={`${styles.accordionBtn} ${isOpen ? styles.accordionBtnOpen : ''}`}
                                            onClick={() => setOpenItem(isOpen ? null : catIdx * 100 + itemIdx)}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div className={`${styles.accordionQuestion} ${isOpen ? styles.accordionQuestionOpen : ''}`}>{item.q}</div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{c.label}</div>
                                            </div>
                                            <ChevronDown open={isOpen} />
                                        </button>
                                        <div className={styles.accordionBody} style={{ maxHeight: isOpen ? '600px' : '0' }}>
                                            <div className={styles.accordionAnswer}>{item.a}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : !cat ? (
                <div className={styles.content}>
                    <p className={styles.noResults}>No FAQs available yet.</p>
                </div>
            ) : (
                <div className={styles.body}>

                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.sidebarCard}>
                            <p className={styles.sidebarTitle}>Categories</p>
                            <ul className={styles.catList}>
                                {faqData.map((c, i) => (
                                    <li key={i}>
                                        <button
                                            className={`${styles.catItem} ${i === activeCat ? styles.catItemActive : ''}`}
                                            onClick={() => selectCat(i)}
                                        >
                      <span style={{ color: i === activeCat ? '#1d4ed8' : '#9ca3af', display: 'flex' }}>
                        {c.icon}
                      </span>
                                            <span className={styles.catItemLabel}>{c.label}</span>
                                            <span className={`${styles.catCount} ${i === activeCat ? styles.catCountActive : ''}`}>
                        {c.items.length}
                      </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.supportCard}>
                            <div className={styles.supportIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <p className={styles.supportTitle}>Still need help?</p>
                            <p className={styles.supportDesc}>Can&apos;t find the answer you&apos;re looking for? We&apos;re here to help.</p>
                            <a
                                href="https://github.com/AMSNextGen25-26/ust-testing-platform/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.supportBtn}
                            >
                                Contact Support
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className={styles.content}>

                        {/* Active category accordion */}
                        <div className={styles.catPanel}>
                            <div className={styles.catPanelHeader}>
                                <div className={styles.catPanelIcon} style={{ background: cat.iconBg }}>
                                    {cat.icon}
                                </div>
                                <div>
                                    <p className={styles.catPanelName}>{cat.label}</p>
                                    <p className={styles.catPanelSub}>{cat.subtitle}</p>
                                </div>
                            </div>
                            {cat.items.map((item, ii) => {
                                const isOpen = openItem === ii
                                return (
                                    <div key={ii} className={styles.accordionItem}>
                                        <button
                                            className={`${styles.accordionBtn} ${isOpen ? styles.accordionBtnOpen : ''}`}
                                            onClick={() => setOpenItem(isOpen ? null : ii)}
                                        >
                      <span className={`${styles.accordionQuestion} ${isOpen ? styles.accordionQuestionOpen : ''}`}>
                        {item.q}
                      </span>
                                            <ChevronDown open={isOpen} />
                                        </button>
                                        <div className={styles.accordionBody} style={{ maxHeight: isOpen ? '600px' : '0' }}>
                                            <div className={styles.accordionAnswer}>{item.a}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Other categories browse */}
                        <div className={styles.catCards}>
                            {otherCats.map((c, idx) => {
                                const realIdx = faqData.indexOf(c)
                                return (
                                    <button key={idx} className={styles.catCard} onClick={() => selectCat(realIdx)}>
                                        <div className={styles.catCardIcon} style={{ background: c.iconBg }}>
                                            {c.icon}
                                        </div>
                                        <div className={styles.catCardBody}>
                                            <div className={styles.catCardName}>
                                                {c.label}
                                                <span className={styles.catCardCount}>{c.items.length} questions</span>
                                            </div>
                                            <p className={styles.catCardDesc}>{c.subtitle}</p>
                                        </div>
                                        <svg className={styles.catCardArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                )
                            })}
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}