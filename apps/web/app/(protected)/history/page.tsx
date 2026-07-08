'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHistory, HistoryItem } from '../../_context/HistoryContext'
import { ScoreRing } from '@/components/ui/score-ring'
import { EvaluationCard } from '@/components/ui/evaluation-card'
import styles from './history.module.css'

function scoreColor(v: number) {
    return v >= 70 ? '#15803d' : v >= 50 ? '#b45309' : '#dc2626'
}

function SubmissionModal({ sub, onClose }: { sub: HistoryItem; onClose: () => void }) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className={styles.modalBack}>← Back</button>

                <p className={styles.modalWorkItem}>Work Item #{sub.azure_work_item_id}</p>
                {sub.user_story_title && (
                    <p className={styles.modalStoryTitle}>{sub.user_story_title}</p>
                )}
                <p className={styles.modalMeta}>Submitted on {sub.date} at {sub.time}</p>

                <div className={styles.modalScoreCard}>
                    <ScoreRing value={sub.score} label="Score" />
                    <ScoreRing value={sub.code_quality} label="Code Quality" />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                        <p style={{ fontSize: '12px', lineHeight: '1.65', color: '#444', margin: 0 }}>{sub.summary}</p>
                    </div>
                </div>

                <div className={styles.modalCriteriaGrid}>
                    <EvaluationCard variant="pass" icon="✓" title={`PASSED (${sub.passed.length})`} items={sub.passed} />
                    <EvaluationCard variant="fail" icon="✗" title={`FAILED (${sub.failed.length})`} items={sub.failed} />
                </div>

                {sub.improvements.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <EvaluationCard variant="improvements" icon="→" title="IMPROVEMENTS" items={sub.improvements} />
                    </div>
                )}

                {sub.notes.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <EvaluationCard variant="bestPractices" icon="★" title="BEST PRACTICES" items={sub.notes} />
                    </div>
                )}
            </div>
        </div>
    )
}

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100]

function parsePageSize(raw: string): number {
    const n = parseInt(raw, 10)
    return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE
}

function HistoryContent() {
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('filter') ?? '')
    const { historyItems, loading } = useHistory()
    const [selected, setSelected] = useState<HistoryItem | null>(null)
    const [page, setPage] = useState(0)
    const [pageSizeRaw, setPageSizeRaw] = useState(String(DEFAULT_PAGE_SIZE))

    const pageSize = parsePageSize(pageSizeRaw)

    const filtered = historyItems.filter(item => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        // A purely numeric query (e.g. coming from a "view history for #7" link) means
        // "this exact work item" — matching it as a substring would also catch #17, #27, etc.
        if (/^\d+$/.test(q)) {
            return item.azure_work_item_id.toLowerCase() === q
        }
        // Date matching only kicks in for date-shaped queries (contains "/"), otherwise a
        // plain text search could spuriously match inside "03/07/26".
        const matchesDate = q.includes('/') && item.date.toLowerCase().includes(q)
        return (
            item.azure_work_item_id.toLowerCase().includes(q) ||
            item.user_story_title.toLowerCase().includes(q) ||
            matchesDate
        )
    })

    const totalPages = Math.ceil(filtered.length / pageSize)
    const pageItems = filtered.slice(page * pageSize, (page + 1) * pageSize)

    function handleSearch(q: string) {
        setSearch(q)
        setPage(0)
    }

    function handlePageSizeChange(raw: string) {
        setPageSizeRaw(raw)
        setPage(0)
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>HISTORY</h1>

            <div className={styles.filterRow}>
                <input
                    type="text"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by ID, title, or date…"
                    className={styles.search}
                />
                <span className={styles.pageSizeLabel}>Show</span>
                <select
                    value={pageSizeRaw}
                    onChange={e => handlePageSizeChange(e.target.value)}
                    className={styles.pageSizeInput}
                >
                    {PAGE_SIZE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <span className={styles.pageSizeLabel}>per page</span>
            </div>

            {loading ? (
                <p className={styles.empty}>Loading…</p>
            ) : filtered.length === 0 ? (
                <p className={styles.empty}>{search ? 'No results found.' : 'No submissions yet.'}</p>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                        <tr>
                            <th>WORK ITEM</th>
                            <th>TITLE</th>
                            <th>DATE</th>
                            <th>TIME</th>
                            <th>SCORE</th>
                            <th className={styles.theadLast}>QUALITY</th>
                        </tr>
                        </thead>
                        <tbody className={styles.tbody}>
                        {pageItems.map(item => (
                            <tr
                                key={item.id}
                                onClick={() => setSelected(item)}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td className={styles.td}>{item.azure_work_item_id}</td>
                                <td className={styles.tdTitle} style={{ color: item.user_story_title ? '#111' : '#aaa' }}>
                                    {item.user_story_title || '—'}
                                </td>
                                <td className={styles.td}>{item.date}</td>
                                <td className={styles.td}>{item.time}</td>
                                <td className={styles.td} style={{ color: scoreColor(item.score), fontWeight: 'bold' }}>
                                    {item.score}%
                                </td>
                                <td className={styles.tdLast} style={{ color: scoreColor(item.code_quality), fontWeight: 'bold' }}>
                                    {item.code_quality}%
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className={styles.pageBtn}
                            >
                                ← Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`${styles.pageBtn} ${i === page ? styles.pageBtnActive : ''}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                                className={styles.pageBtn}
                            >
                                Next →
                            </button>
                            <span className={styles.pageInfo}>
                Page {page + 1} of {totalPages} · {filtered.length} submissions
              </span>
                        </div>
                    )}
                </>
            )}

            {selected && <SubmissionModal sub={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', fontFamily: 'monospace' }}>Loading...</div>}>
            <HistoryContent />
        </Suspense>
    )
}