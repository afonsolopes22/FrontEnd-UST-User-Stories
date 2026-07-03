'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useHistory } from '../../_context/HistoryContext'
import styles from './dashboard.module.css'

const DEFAULT_PAGE_SIZE = 5

function parseItemDate(date: string, time: string): Date {
  const [day, month, year] = date.split('/')
  const [hour = '0', minute = '0'] = time.split(':')
  return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
}

function relativeTime(date: string, time: string): string {
  const d = parseItemDate(date, time)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function scoreColor(s: number) {
  return s >= 70 ? '#15803d' : s >= 50 ? '#b45309' : '#dc2626'
}

function scoreBarColor(s: number) {
  return s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
}

function qualityLabel(s: number) {
  return s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low'
}

export default function Page() {
  const { historyItems, loading, removeWorkItem } = useHistory()

  const [search, setSearch] = useState('')
  const [filterUnder50, setFilterUnder50] = useState(false)
  const [dateFilter, setDateFilter] = useState('any')
  const [page, setPage] = useState(0)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const pageSize = DEFAULT_PAGE_SIZE

  const workItemIds = useMemo(
    () => [...new Set(historyItems.map(i => i.azure_work_item_id))],
    [historyItems]
  )

  const rows = useMemo(
    () => workItemIds.map(wid => ({
      wid,
      latest: historyItems.find(h => h.azure_work_item_id === wid)!,
      count: historyItems.filter(h => h.azure_work_item_id === wid).length,
    })),
    [workItemIds, historyItems]
  )

  // Stats
  const avgScore = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.latest.score, 0) / rows.length)
    : 0
  const lowQualityCount = rows.filter(r => r.latest.score < 50).length

  // Filtered rows
  const cutoff = useMemo(() => {
    if (dateFilter === 'today') return new Date(new Date().setHours(0, 0, 0, 0))
    if (dateFilter === '7d') return new Date(Date.now() - 7 * 86400000)
    if (dateFilter === '30d') return new Date(Date.now() - 30 * 86400000)
    return null
  }, [dateFilter])

  const filtered = useMemo(() => rows.filter(({ wid, latest }) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!wid.toLowerCase().includes(q) && !latest.user_story_title.toLowerCase().includes(q)) return false
    }
    if (filterUnder50 && latest.score >= 50) return false
    if (cutoff && parseItemDate(latest.date, latest.time) < cutoff) return false
    return true
  }), [rows, search, filterUnder50, cutoff])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const pageItems = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const hasFilters = search || filterUnder50 || dateFilter !== 'any'

  function resetPage() { setPage(0) }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Stories</h1>
        <p className={styles.pageSubtitle}>Manage and analyze your user stories.</p>
      </div>

      {/* Stats cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} data-tooltip="Total number of unique user stories evaluated in the platform.">
          <div className={styles.statIconRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className={styles.statLabel}>Total Stories</p>
          <p className={styles.statValue}>{rows.length}</p>
          <p className={styles.statMeta}>All time</p>
        </div>

        <div className={styles.statCard} data-tooltip="User stories that have been through at least one quality analysis.">
          <div className={styles.statIconRowGreen}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className={styles.statLabel}>Analyzed Stories</p>
          <p className={styles.statValue}>{rows.length}</p>
          <p className={styles.statMetaGreen}>100% of total</p>
        </div>

        <div className={styles.statCard} data-tooltip="Average quality score across all analyzed user stories (0–100%).">
          <div className={styles.statIconRowAmber}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className={styles.statLabel}>Average Score</p>
          <p className={styles.statValue}>{avgScore}%</p>
          <p className={styles.statMeta}>Across all stories</p>
        </div>

        <div className={styles.statCard} data-tooltip="Stories scoring below 50% — these need review and improvement.">
          <div className={styles.statIconRowRed}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className={styles.statLabel}>Attention Needed Stories</p>
          <p className={styles.statValue}>{lowQualityCount}</p>
          {lowQualityCount > 0
            ? <p className={styles.statMetaRed}>Needs attention</p>
            : <p className={styles.statMetaGreen}>All good!</p>
          }
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
            placeholder="Search by ID, title or keyword..."
            className={styles.search}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={`${styles.filterSelect} ${styles.filterCheckboxLabel}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className={styles.filterLabel}>Quality:</span>
            <input
              type="checkbox"
              className={styles.filterCheckbox}
              checked={filterUnder50}
              onChange={e => { setFilterUnder50(e.target.checked); resetPage() }}
            />
            <span style={{ fontSize: 13, color: filterUnder50 ? '#dc2626' : '#374151', fontWeight: filterUnder50 ? 600 : 400 }}>Under 50%</span>
          </label>

          <label className={styles.filterSelect}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className={styles.filterLabel}>Last evaluation:</span>
            <select className={styles.filterSelectEl} value={dateFilter} onChange={e => { setDateFilter(e.target.value); resetPage() }}>
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>

          {hasFilters && (
            <button
              className={styles.clearBtn}
              onClick={() => { setSearch(''); setFilterUnder50(false); setDateFilter('any'); resetPage() }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>
          {hasFilters ? 'No results match the current filters.' : 'No stories yet. Go to Analyse to evaluate a work item.'}
        </p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>TITLE</th>
                  <th className={styles.th}>LAST EVALUATION</th>
                  <th className={styles.th}>SCORE</th>
                  <th className={styles.th}>QUALITY</th>
                  <th className={styles.th}>HISTORY</th>
                  <th className={styles.th}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(({ wid, latest, count }) => (
                  <tr key={wid} className={styles.row}>
                    <td className={styles.td}>
                      <span className={styles.idBadge}>#{wid}</span>
                    </td>

                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Link href={`/user-story?work_item_id=${wid}`} className={styles.titleLink}>
                          {latest.user_story_title || '—'}
                        </Link>
                        {latest.score < 50 && (
                          <span title="Score below 50% — needs attention" style={{ fontSize: 13, lineHeight: 1 }}>⚠️</span>
                        )}
                      </div>
                      <span className={styles.statusDot}>
                        <span className={styles.dotGreen} />
                        Analyzed
                      </span>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.evalRelative}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {relativeTime(latest.date, latest.time)}
                      </div>
                      <div className={styles.evalAbsolute}>{latest.date} {latest.time}</div>
                    </td>

                    <td className={styles.td}>
                      <span style={{ color: scoreColor(latest.score), fontWeight: 600 }}>
                        {latest.score}%
                      </span>
                      <div className={styles.scoreBar}>
                        <div
                          className={styles.scoreBarFill}
                          style={{ width: `${latest.score}%`, background: scoreBarColor(latest.score) }}
                        />
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span className={`${styles.qualityBadge} ${
                        latest.score >= 70 ? styles.qualityHigh
                        : latest.score >= 50 ? styles.qualityMedium
                        : styles.qualityLow
                      }`}>
                        {qualityLabel(latest.score)}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <Link href={`/history?filter=${wid}`} className={styles.historyLink}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {count}
                      </Link>
                    </td>

                    <td className={styles.td}>
                      {confirmDeleteId === wid ? (
                        <div className={styles.confirmRow}>
                          <span className={styles.confirmLabel}>Delete all?</span>
                          <button
                            className={styles.confirmYes}
                            onClick={() => { removeWorkItem(wid); setConfirmDeleteId(null) }}
                          >
                            Yes
                          </button>
                          <button
                            className={styles.confirmNo}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actions}>
                          <Link href={`/user-story?work_item_id=${wid}`} className={styles.actionBtn}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </Link>
                          <Link
                            href={`/user-story?work_item_id=${wid}&evaluate=1`}
                            className={`${styles.actionBtn} ${styles.actionBtnBlue}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="13 2 13 9 20 9" /><polygon points="22 12 18 8 2 8 2 20 22 20 22 12" />
                            </svg>
                            Analyse
                          </Link>
                          <button
                            className={styles.deleteIcon}
                            onClick={() => setConfirmDeleteId(wid)}
                            title="Delete all submissions"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom: info + pagination */}
          <div className={styles.bottomRow}>
            <span className={styles.pageInfo}>
              {filtered.length === 0 ? '0' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)}`} of {filtered.length} stories
            </span>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => {
                  const nearCurrent = Math.abs(i - page) <= 1
                  const isEdge = i === 0 || i === totalPages - 1
                  const isEllipsisBefore = i === page - 2 && i > 1
                  const isEllipsisAfter = i === page + 2 && i < totalPages - 2
                  if (isEllipsisBefore || isEllipsisAfter) return <span key={i} className={styles.pageEllipsis}>…</span>
                  if (!nearCurrent && !isEdge) return null
                  return (
                    <button key={i} className={`${styles.pageBtn} ${i === page ? styles.pageBtnActive : ''}`} onClick={() => setPage(i)}>
                      {i + 1}
                    </button>
                  )
                })}
                <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>›</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
