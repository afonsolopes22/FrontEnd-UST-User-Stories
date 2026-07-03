'use client'

import { useState } from "react"
import Link from "next/link"
import { useHistory } from "../../_context/HistoryContext"
import styles from "./user-stories.module.css"

const DEFAULT_PAGE_SIZE = 5

function parsePageSize(raw: string): number {
  const n = parseInt(raw, 10)
  return n >= 1 && n <= 50 ? n : DEFAULT_PAGE_SIZE
}

export default function Page() {
  const { historyItems, loading, removeWorkItem } = useHistory()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSizeRaw, setPageSizeRaw] = useState(String(DEFAULT_PAGE_SIZE))
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const pageSize = parsePageSize(pageSizeRaw)

  const workItemIds = [...new Set(historyItems.map(i => i.azure_work_item_id))]

  const filteredIds = workItemIds.filter(wid => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const latest = historyItems.find(h => h.azure_work_item_id === wid)!
    return wid.toLowerCase().includes(q) || latest.user_story_title.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filteredIds.length / pageSize)
  const pageIds = filteredIds.slice(page * pageSize, (page + 1) * pageSize)

  function handleSearch(q: string) {
    setSearch(q)
    setPage(0)
    setConfirmDeleteId(null)
  }

  function handlePageSizeChange(raw: string) {
    setPageSizeRaw(raw)
    setPage(0)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>USER STORIES</h1>

      <div className={styles.filterRow}>
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by ID or title…"
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
      ) : filteredIds.length === 0 ? (
        <p className={styles.empty}>{search ? 'No results found.' : 'No submissions yet.'}</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>WORK ITEM</th>
                <th>TITLE</th>
                <th>HISTORY</th>
                <th>LAST EVAL</th>
                <th>SCORE</th>
                <th>QUALITY</th>
                <th />
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {pageIds.map((wid) => {
                const latest = historyItems.find(h => h.azure_work_item_id === wid)!
                const count = historyItems.filter(h => h.azure_work_item_id === wid).length
                const scoreColor = latest.score >= 70 ? '#15803d' : latest.score >= 50 ? '#b45309' : '#dc2626'
                const qualityColor = latest.code_quality >= 70 ? '#15803d' : latest.code_quality >= 50 ? '#b45309' : '#dc2626'
                return (
                  <tr key={wid}>
                    <td className={styles.td}>{wid}</td>
                    <td className={styles.td}>
                      <Link
                        href={`/user-story?work_item_id=${wid}`}
                        className={styles.titleLink}
                        style={{ color: latest.user_story_title ? '#111' : '#aaa' }}
                        title="View user story"
                      >
                        {latest.user_story_title || '—'}
                      </Link>
                    </td>
                    <td className={styles.td}>
                      <Link
                        href={`/history?filter=${wid}`}
                        className={styles.pillBlue}
                        title="View all submissions for this work item"
                      >
                        {count}
                      </Link>
                    </td>
                    <td className={styles.td}>{latest.date}</td>
                    <td className={styles.td} style={{ color: scoreColor, fontWeight: 'bold' }}>{latest.score}%</td>
                    <td className={styles.td} style={{ color: qualityColor, fontWeight: 'bold' }}>{latest.code_quality}%</td>
                    <td className={styles.tdRight}>
                      {confirmDeleteId === wid ? (
                        <span className={styles.confirmRow}>
                          <span className={styles.confirmLabel}>Delete all submissions?</span>
                          <button
                            onClick={() => { removeWorkItem(wid); setConfirmDeleteId(null) }}
                            className={styles.pillRed}
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className={styles.pillCancel}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(wid)}
                          className={styles.deleteBtn}
                          title="Delete this work item and all its submissions"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
                Page {page + 1} of {totalPages} · {filteredIds.length} work items
              </span>

            </div>
          )}
        </>
      )}
    </div>
  )
}
