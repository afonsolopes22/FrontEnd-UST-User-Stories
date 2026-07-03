'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@/app/_context/AuthContext"

export type HistoryItem = {
  id: string
  azure_work_item_id: string
  user_story_title: string
  github_url: string
  date: string
  time: string
  score: number
  code_quality: number
  max: number
  summary: string
  passed: string[]
  failed: string[]
  improvements: string[]
  notes: string[]
}

export type NewEvaluation = {
  azure_work_item_id: string
  user_story_title: string
  github_url: string
  score: number
  code_quality: number
  summary: string
  passed: string[]
  failed: string[]
  improvements: string[]
  notes: string[]
}

type HistoryContextType = {
  historyItems: HistoryItem[]
  loading: boolean
  addHistoryItem: (payload: NewEvaluation) => Promise<HistoryItem>
  removeHistoryItem: (id: string) => Promise<void>
  removeWorkItem: (workItemId: string) => Promise<void>
}

function mapRow(row: Record<string, unknown>): HistoryItem {
  const d = new Date(row.created_at as string)
  return {
    id: row.id as string,
    azure_work_item_id: String(row.azure_work_item_id ?? ''),
    user_story_title: (row.user_story as string) ?? '',
    github_url: (row.github_url as string) ?? '',
    date: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
    score: (row.score as number) ?? 0,
    code_quality: (row.code_quality as number) ?? 0,
    max: 100,
    summary: (row.summary as string) ?? '',
    passed: (row.met_criteria as string[]) ?? [],
    failed: (row.failed_criteria as string[]) ?? [],
    improvements: (row.improvements as string[]) ?? [],
    notes: (row.notes as string[]) ?? [],
  }
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated' || !token) { setLoading(false); return }
    setLoading(true)
    fetch('/api/user-stories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setHistoryItems(Array.isArray(data) ? data.map(mapRow) : []))
      .finally(() => setLoading(false))
  }, [status, token])

  const addHistoryItem = async (payload: NewEvaluation): Promise<HistoryItem> => {
    const res = await fetch('/api/user-stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const row = await res.json()
    if (!res.ok) throw new Error(row?.error ?? 'Failed to save evaluation.')
    const item = mapRow(row)
    setHistoryItems(prev => [item, ...prev])
    return item
  }

  const removeHistoryItem = async (id: string): Promise<void> => {
    await fetch(`/api/user-stories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setHistoryItems(prev => prev.filter(item => item.id !== id))
  }

  const removeWorkItem = async (workItemId: string): Promise<void> => {
    const toRemove = historyItems.filter(i => i.azure_work_item_id === workItemId)
    await Promise.all(toRemove.map(i => fetch(`/api/user-stories/${i.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })))
    setHistoryItems(prev => prev.filter(i => i.azure_work_item_id !== workItemId))
  }

  return (
    <HistoryContext.Provider value={{ historyItems, loading, addHistoryItem, removeHistoryItem, removeWorkItem }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error("useHistory must be used inside HistoryProvider")
  return ctx
}
