'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useHistory, HistoryItem } from '../../_context/HistoryContext'
import { useAuth } from '@/app/_context/AuthContext'
import { CoreSpinLoader } from '@/components/ui/core-spin-loader'
import { ScoreRing } from '@/components/ui/score-ring'
import styles from './user-story.module.css'

const EVALUATE_URL = 'https://tfc-userstories.onrender.com/evaluate/azure/sync'
const HIST_PAGE_SIZE = 2


function scoreColor(v: number) {
    return v >= 70 ? '#15803d' : v >= 50 ? '#b45309' : '#dc2626'
}

// ── Components ────────────────────────────────────────────────────────────────

function SubmissionModal({ sub, onClose }: { sub: HistoryItem; onClose: () => void }) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className={styles.modalBack}>← Back</button>

                <p className={styles.modalMeta}>Submitted on {sub.date} at {sub.time}</p>

                <div className={styles.modalScoreCard}>
                    <ScoreRing value={sub.score} label="Score" />
                    <ScoreRing value={sub.code_quality} label="Code Quality" />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                        <p style={{ fontSize: '12px', lineHeight: '1.65', color: '#444', margin: 0 }}>{sub.summary}</p>
                    </div>
                </div>

                <div className={styles.modalCriteriaGrid}>
                    <div className={styles.criteriaCardGreen}>
                        <div className={styles.criteriaHeader}>
                            <span>✓</span>
                            <span className={styles.criteriaLabelGreen}>PASSED ({sub.passed.length})</span>
                        </div>
                        {sub.passed.length === 0
                            ? <p className={styles.criteriaEmpty}>—</p>
                            : <ul className={styles.criteriaListGreen}>
                                {sub.passed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                            </ul>
                        }
                    </div>
                    <div className={styles.criteriaCardOrange}>
                        <div className={styles.criteriaHeader}>
                            <span>✗</span>
                            <span className={styles.criteriaLabelOrange}>FAILED ({sub.failed.length})</span>
                        </div>
                        {sub.failed.length === 0
                            ? <p className={styles.criteriaEmpty}>—</p>
                            : <ul className={styles.criteriaListOrange}>
                                {sub.failed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                            </ul>
                        }
                    </div>
                </div>

                {sub.improvements.length > 0 && (
                    <div className={styles.improvementsCard}>
                        <div className={styles.criteriaHeader}>
                            <span>→</span>
                            <span className={styles.improvementsLabel}>IMPROVEMENTS</span>
                        </div>
                        <ul className={styles.improvementsList}>
                            {sub.improvements.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    </div>
                )}

                {sub.notes.length > 0 && (
                    <div className={styles.improvementsCard} style={{ borderLeftColor: '#0ea5e9' }}>
                        <div className={styles.criteriaHeader}>
                            <span style={{ color: '#0369a1' }}>★</span>
                            <span className={styles.improvementsLabel} style={{ color: '#0369a1' }}>BEST PRACTICES</span>
                        </div>
                        <ul className={styles.improvementsList}>
                            {sub.notes.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function WorkItemDetail() {
    const searchParams = useSearchParams()
    const workItemId = searchParams.get('work_item_id')
    const shouldEvaluate = searchParams.get('evaluate') === '1'
    const projectId = searchParams.get('project_id')
    const branch = searchParams.get('branch') ?? 'main'
    const { token } = useAuth()
    const { historyItems, loading, addHistoryItem } = useHistory()
    const [selectedSubmission, setSelectedSubmission] = useState<HistoryItem | null>(null)

    type EvalResult = {
        score: number; code_quality: number; user_story_title: string; summary: string
        passed: string[]; failed: string[]; improvements: string[]
        best_practices_feedback: string[]
        github_url: string; pr_url: string | null; azure_work_item_id: number
    }

    const [histPage, setHistPage] = useState(0)
    const [evaluating, setEvaluating] = useState(false)
    const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
    const [evalError, setEvalError] = useState<string | null>(null)
    const hasStarted = useRef(false)
    const router = useRouter()

    useEffect(() => { setHistPage(0) }, [workItemId])

    useEffect(() => {
        if (!shouldEvaluate || !workItemId || hasStarted.current) return
        hasStarted.current = true
        setEvaluating(true)

        async function runEvaluation() {
            try {
                const storedOrg = (() => { try { const s = localStorage.getItem('current_org'); return s ? JSON.parse(s) : null } catch { return null } })()
                if (!storedOrg?.id) throw new Error('No organization configured. Go to Settings to add one.')
                if (!projectId) throw new Error('No project selected. Go back and select a project.')

                const response = await fetch(EVALUATE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        work_item_id: parseInt(workItemId!),
                        organization_id: storedOrg.id,
                        project_id: parseInt(projectId),
                        branch: branch,
                    }),
                })

                if (!response.ok) {
                    const err = await response.json().catch(() => null)
                    throw new Error(err?.detail ?? err?.message ?? `Error ${response.status}`)
                }

                const data = await response.json() as {
                    score: number; code_quality: number; user_story_title: string; summary: string;
                    passed: string[]; failed: string[]; improvements: string[];
                    best_practices_feedback: string[];
                    github_url: string; pr_url: string | null; azure_work_item_id: number
                }

                await addHistoryItem({
                    azure_work_item_id: String(data.azure_work_item_id),
                    user_story_title: data.user_story_title ?? '',
                    github_url: data.github_url ?? '',
                    score: data.score ?? 0,
                    code_quality: data.code_quality ?? 0,
                    summary: data.summary ?? '',
                    passed: data.passed ?? [],
                    failed: data.failed ?? [],
                    improvements: data.improvements ?? [],
                    notes: data.best_practices_feedback ?? [],
                })

                setEvalResult(data)
                setEvaluating(false)
            } catch (err) {
                setEvalError(err instanceof Error ? err.message : 'Unexpected error.')
                setEvaluating(false)
            }
        }

        runEvaluation()
    }, [shouldEvaluate, workItemId])

    // ── Evaluate view (loading → results) ──────────────────────────────────────
    if (shouldEvaluate) {
        // Loading skeleton
        if (evaluating || (!evalResult && !evalError)) {
            return (
                <div className={styles.page}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{ margin: 0, fontSize: '20px' }}>
                            Work Item <span className={styles.workItemId}>#{workItemId}</span>
                        </h1>
                    </div>
                    <CoreSpinLoader />
                </div>
            )
        }

        // Error
        if (evalError) {
            return (
                <div className={styles.page}>
                    <p className={styles.streamError}>{evalError}</p>
                    <button onClick={() => router.back()} style={{ marginTop: '1rem', cursor: 'pointer', fontSize: 13, color: '#5236ab', background: 'none', border: 'none', textDecoration: 'underline' }}>
                        ← Go back
                    </button>
                </div>
            )
        }

        // Full result view
        const r = evalResult!
        return (
            <div className={styles.page}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px' }}>
                            Work Item <span className={styles.workItemId}>#{r.azure_work_item_id}</span>
                        </h1>
                        {r.user_story_title && (
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{r.user_story_title}</p>
                        )}
                    </div>
                    <button
                        onClick={() => router.replace(`/user-story?work_item_id=${r.azure_work_item_id}`)}
                        style={{ fontSize: 12, color: '#5236ab', background: 'none', border: '1px solid #ddd8f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        View history →
                    </button>
                </div>

                <div className={styles.scoreCard}>
                    <ScoreRing value={r.score} label="Score" />
                    <ScoreRing value={r.code_quality} label="Code Quality" />
                    <p className={styles.scoreSummary}>{r.summary}</p>
                </div>

                <div className={styles.criteriaGrid}>
                    <div className={styles.criteriaCardGreen}>
                        <div className={styles.criteriaHeader}>
                            <span>✓</span>
                            <span className={styles.criteriaLabelGreen}>PASSED ({r.passed.length})</span>
                        </div>
                        {r.passed.length === 0
                            ? <p className={styles.criteriaEmpty}>—</p>
                            : <ul className={styles.criteriaListGreen}>{r.passed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}</ul>
                        }
                    </div>
                    <div className={styles.criteriaCardOrange}>
                        <div className={styles.criteriaHeader}>
                            <span>✗</span>
                            <span className={styles.criteriaLabelOrange}>FAILED ({r.failed.length})</span>
                        </div>
                        {r.failed.length === 0
                            ? <p className={styles.criteriaEmpty}>—</p>
                            : <ul className={styles.criteriaListOrange}>{r.failed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}</ul>
                        }
                    </div>
                </div>

                {r.improvements.length > 0 && (
                    <div className={styles.improvementsCard}>
                        <div className={styles.criteriaHeader}>
                            <span>→</span>
                            <span className={styles.improvementsLabel}>IMPROVEMENTS</span>
                        </div>
                        <ul className={styles.improvementsList}>
                            {r.improvements.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    </div>
                )}

                {r.best_practices_feedback?.length > 0 && (
                    <div className={styles.improvementsCard} style={{ borderLeftColor: '#0ea5e9' }}>
                        <div className={styles.criteriaHeader}>
                            <span style={{ color: '#0369a1' }}>★</span>
                            <span className={styles.improvementsLabel} style={{ color: '#0369a1' }}>BEST PRACTICES</span>
                        </div>
                        <ul className={styles.improvementsList}>
                            {r.best_practices_feedback.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    // ── Static view ─────────────────────────────────────────────────────────────
    if (loading) {
        return <div className={styles.page} style={{ color: '#888' }}>Loading…</div>
    }

    const submissions = historyItems.filter(h => h.azure_work_item_id === workItemId)
    const latest = submissions[0]

    if (!workItemId || submissions.length === 0) {
        return (
            <div className={styles.page}>
                <p>Work item not found.</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>

            {selectedSubmission && (
                <SubmissionModal sub={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '20px' }}>
                    Work Item <span className={styles.workItemId}>#{workItemId}</span>
                </h1>
                <p className={styles.headerMeta}>Last evaluated: {latest.date} · {latest.time}</p>
            </div>

            <div className={styles.scoreCard}>
                <ScoreRing value={latest.score} label="Score" />
                <ScoreRing value={latest.code_quality} label="Code Quality" />
                <p className={styles.scoreSummary}>{latest.summary}</p>
            </div>

            <div className={styles.criteriaGrid}>
                <div className={styles.criteriaCardGreen}>
                    <div className={styles.criteriaHeader}>
                        <span>✓</span>
                        <span className={styles.criteriaLabelGreen}>PASSED ({latest.passed.length})</span>
                    </div>
                    {latest.passed.length === 0
                        ? <p className={styles.criteriaEmpty}>—</p>
                        : <ul className={styles.criteriaListGreen}>
                            {latest.passed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    }
                </div>

                <div className={styles.criteriaCardOrange}>
                    <div className={styles.criteriaHeader}>
                        <span>✗</span>
                        <span className={styles.criteriaLabelOrange}>FAILED ({latest.failed.length})</span>
                    </div>
                    {latest.failed.length === 0
                        ? <p className={styles.criteriaEmpty}>—</p>
                        : <ul className={styles.criteriaListOrange}>
                            {latest.failed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                        </ul>
                    }
                </div>
            </div>

            {latest.improvements.length > 0 && (
                <div className={styles.improvementsCard}>
                    <div className={styles.criteriaHeader}>
                        <span>→</span>
                        <span className={styles.improvementsLabel}>IMPROVEMENTS</span>
                    </div>
                    <ul className={styles.improvementsList}>
                        {latest.improvements.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                    </ul>
                </div>
            )}

            {latest.notes.length > 0 && (
                <div className={styles.improvementsCard} style={{ borderLeftColor: '#0ea5e9' }}>
                    <div className={styles.criteriaHeader}>
                        <span style={{ color: '#0369a1' }}>★</span>
                        <span className={styles.improvementsLabel} style={{ color: '#0369a1' }}>BEST PRACTICES</span>
                    </div>
                    <ul className={styles.improvementsList}>
                        {latest.notes.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                    </ul>
                </div>
            )}

            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <h2 className={styles.historyTitle}>SUBMISSION HISTORY ({submissions.length})</h2>
                </div>
                {(() => {
                    const totalHistPages = Math.ceil(submissions.length / HIST_PAGE_SIZE)
                    const pageSubs = submissions.slice(histPage * HIST_PAGE_SIZE, (histPage + 1) * HIST_PAGE_SIZE)
                    return (
                        <>
                            <table className={styles.historyTable}>
                                <thead>
                                <tr>
                                    <th className={styles.historyTh}>#</th>
                                    <th className={styles.historyTh}>DATE</th>
                                    <th className={styles.historyTh}>TIME</th>
                                    <th className={styles.historyTh}>SCORE</th>
                                    <th className={styles.historyThLast}>CODE QUALITY</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageSubs.map((s, i) => {
                                    const globalIdx = histPage * HIST_PAGE_SIZE + i
                                    const isLatest = globalIdx === 0
                                    return (
                                        <tr
                                            key={s.id}
                                            onClick={() => setSelectedSubmission(s)}
                                            className={styles.historyRow}
                                            style={{ background: isLatest ? '#f9f9f9' : 'transparent' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                                            onMouseLeave={e => (e.currentTarget.style.background = isLatest ? '#f9f9f9' : 'transparent')}
                                        >
                                            <td className={styles.historyTd} style={{ fontWeight: isLatest ? 'bold' : 'normal' }}>
                                                {submissions.length - globalIdx}{isLatest ? ' ★' : ''}
                                            </td>
                                            <td className={styles.historyTd}>{s.date}</td>
                                            <td className={styles.historyTd}>{s.time}</td>
                                            <td className={styles.historyTd} style={{ color: scoreColor(s.score), fontWeight: 'bold' }}>
                                                {s.score}%
                                            </td>
                                            <td className={styles.historyTdLast} style={{ color: scoreColor(s.code_quality), fontWeight: 'bold' }}>
                                                {s.code_quality}%
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>

                            {totalHistPages > 1 && (
                                <div className={styles.histPagination}>
                  <span className={styles.histPageInfo}>
                    {histPage * HIST_PAGE_SIZE + 1}–{Math.min((histPage + 1) * HIST_PAGE_SIZE, submissions.length)} of {submissions.length}
                  </span>
                                    <div className={styles.histPageBtns}>
                                        <button className={styles.histPageBtn} onClick={() => setHistPage(p => p - 1)} disabled={histPage === 0}>‹</button>
                                        {Array.from({ length: totalHistPages }, (_, i) => {
                                            const nearCurrent = Math.abs(i - histPage) <= 1
                                            const isEdge = i === 0 || i === totalHistPages - 1
                                            const isEllipsisBefore = i === histPage - 2 && i > 1
                                            const isEllipsisAfter = i === histPage + 2 && i < totalHistPages - 2
                                            if (isEllipsisBefore || isEllipsisAfter) return <span key={i} className={styles.histPageEllipsis}>…</span>
                                            if (!nearCurrent && !isEdge) return null
                                            return (
                                                <button key={i} className={`${styles.histPageBtn} ${i === histPage ? styles.histPageBtnActive : ''}`} onClick={() => setHistPage(i)}>
                                                    {i + 1}
                                                </button>
                                            )
                                        })}
                                        <button className={styles.histPageBtn} onClick={() => setHistPage(p => p + 1)} disabled={histPage === totalHistPages - 1}>›</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                })()}
            </div>

        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', fontFamily: 'monospace' }}>Loading...</div>}>
            <WorkItemDetail />
        </Suspense>
    )
}