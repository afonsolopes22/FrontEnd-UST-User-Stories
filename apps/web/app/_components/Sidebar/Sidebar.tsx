'use client'
import Link from "next/link"
import { useCallback, useState } from "react"
import { useHistory } from "../../_context/HistoryContext"
import styles from "./Sidebar.module.css"

const MIN_WIDTH = 200
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 260

function scoreColor(v: number) {
  return v >= 70 ? '#15803d' : v >= 50 ? '#b45309' : '#dc2626'
}

export default function Sidebar() {
  const { historyItems } = useHistory()
  const totalCount = historyItems.length
  const recentItems = historyItems.slice(0, 5)

  const [width, setWidth] = useState(DEFAULT_WIDTH)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    const onMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta)))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [width])

  return (
    <aside
      className={styles.sidebar}
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
    >
      <div className={styles.resizeHandle} onMouseDown={startResize} />

      <Link href="/history" className={styles.historyHeader}>
        <span>History</span>
        <span className={styles.historyHeaderArrow}>→</span>
      </Link>

      <ul className={styles.list}>
        {recentItems.map((item, i) => (
          <li key={item.id} className={styles.item}>
            <Link href={`/user-story?work_item_id=${item.azure_work_item_id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className={styles.itemTop}>
                <span className={styles.itemName}>#{totalCount - i}</span>
                {i === 0 && <span className={styles.latestBadge}>latest</span>}
              </div>
              <div className={styles.itemTitle}>
                {item.user_story_title || <span style={{ color: '#aaa' }}>—</span>}
              </div>
              <div className={styles.itemScore}>
                <span style={{ color: scoreColor(item.score), fontWeight: 'bold' }}>{item.score}%</span>
                {' '}<span style={{ color: '#999' }}>score</span>
                {'  '}
                <span style={{ color: scoreColor(item.code_quality), fontWeight: 'bold' }}>{item.code_quality}%</span>
                {' '}<span style={{ color: '#999' }}>quality</span>
              </div>
              <div className={styles.itemBottom}>
                <span className={styles.itemDate}>{item.date}</span>
                <span className={styles.itemTime}>{item.time}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/history" className={styles.more}>More…</Link>
    </aside>
  )
}
