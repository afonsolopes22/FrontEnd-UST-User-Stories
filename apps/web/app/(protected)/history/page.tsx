'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHistory, HistoryItem } from '../../_context/HistoryContext'
import styles from './history.module.css'

function scoreColor(v: number) {
  return v >= 70 ? '#15803d' : v >= 50 ? '#b45309' : '#dc2626'
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - value / 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', fill: '#111' }}>
          {value}%
        </text>
      </svg>
      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
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
          <ScoreRing value={sub.score} label="Score" color="#1d4ed8" />
          <ScoreRing value={sub.code_quality} label="Code Quality" color="#059669" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
            <p style={{ fontSize: '12px', lineHeight: '1.65', color: '#444', margin: 0 }}>{sub.summary}</p>
          </div>
        </div>

        <div className={styles.modalCriteriaGrid}>
          <div className={styles.criteriaCardGreen}>
            <div className={styles.criteriaLabelGreen}>✓ PASSED ({sub.passed.length})</div>
            {sub.passed.length === 0
              ? <p className={styles.criteriaEmpty}>—</p>
              : <ul className={styles.criteriaListGreen}>
                  {sub.passed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                </ul>}
          </div>
          <div className={styles.criteriaCardOrange}>
            <div className={styles.criteriaLabelOrange}>✗ FAILED ({sub.failed.length})</div>
            {sub.failed.length === 0
              ? <p className={styles.criteriaEmpty}>—</p>
              : <ul className={styles.criteriaListOrange}>
                  {sub.failed.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                </ul>}
          </div>
        </div>

        {sub.improvements.length > 0 && (
          <div className={styles.improvementsCard}>
            <div className={styles.improvementsLabel}>→ IMPROVEMENTS</div>
            <ul className={styles.improvementsList}>
              {sub.improvements.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const DEFAULT_PAGE_SIZE = 5

function parsePageSize(raw: string): number {
  const n = parseInt(raw, 10)
  return n >= 1 && n <= 50 ? n : DEFAULT_PAGE_SIZE
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
    return (
      item.azure_work_item_id.toLowerCase().includes(q) ||
      item.user_story_title.toLowerCase().includes(q) ||
      item.date.toLowerCase().includes(q)
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
        <input
          type="number"
          min={1}
          max={50}
          value={pageSizeRaw}
          onChange={e => handlePageSizeChange(e.target.value)}
          onBlur={() => setPageSizeRaw(String(pageSize))}
          className={styles.pageSizeInput}
        />
        <span className={styles.pageSizeLabel}>per page (1–50)</span>
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
