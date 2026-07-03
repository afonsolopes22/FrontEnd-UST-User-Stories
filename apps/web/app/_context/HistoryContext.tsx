'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
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
    user_id: number | null
    user_name: string | null
    team_id: number | null
    team_name: string | null
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

// A team the current user belongs to, with the history visibility scope an admin
// configured for it in Settings > Teams (team / project / organization).
export type HistoryTeam = {
    id: number
    name: string
    project_id: number
    history_visibility: 'team' | 'project' | 'organization'
}

type HistoryContextType = {
    historyItems: HistoryItem[]
    loading: boolean
    teams: HistoryTeam[]
    teamFilter: number | null
    setTeamFilter: (teamId: number | null) => void
    refresh: () => Promise<void>
    addHistoryItem: (payload: NewEvaluation) => Promise<HistoryItem | null>
    removeHistoryItem: (id: string) => Promise<void>
    removeWorkItem: (workItemId: string) => Promise<void>
}

function mapRow(row: Record<string, unknown>): HistoryItem {
    const createdAt = (row.created_at as string) ?? null
    const d = createdAt ? new Date(createdAt) : new Date()
    return {
        id: String(row.id ?? ''),
        azure_work_item_id: String(row.azure_work_item_id ?? ''),
        user_story_title: (row.user_story_title as string) ?? '',
        github_url: (row.github_url as string) ?? '',
        date: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        score: (row.score as number) ?? 0,
        code_quality: (row.code_quality as number) ?? 0,
        max: 100,
        summary: (row.summary as string) ?? '',
        passed: (row.passed as string[]) ?? [],
        failed: (row.failed as string[]) ?? [],
        improvements: (row.improvements as string[]) ?? [],
        notes: (row.best_practices_feedback as string[]) ?? [],
        user_id: (row.user_id as number) ?? null,
        user_name: (row.user_name as string) ?? null,
        team_id: (row.team_id as number) ?? null,
        team_name: (row.team_name as string) ?? null,
    }
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
    const { status, token } = useAuth()
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    const [teams, setTeams] = useState<HistoryTeam[]>([])
    const [teamFilter, setTeamFilter] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchHistory = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const qs = new URLSearchParams({ page: '1', limit: '300' })
            if (teamFilter !== null) qs.set('team_id', String(teamFilter))
            const res = await fetch(`/api/user-stories?${qs.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (!res.ok) {
                setHistoryItems([])
                return
            }
            const items = Array.isArray(data?.items) ? data.items : []
            setHistoryItems(items.map(mapRow))
            if (Array.isArray(data?.teams)) setTeams(data.teams)
        } finally {
            setLoading(false)
        }
    }, [token, teamFilter])

    useEffect(() => {
        if (status === 'loading') return
        if (status !== 'authenticated' || !token) { setLoading(false); return }
        fetchHistory()
    }, [status, token, fetchHistory])

    const addHistoryItem = async (_payload: NewEvaluation): Promise<HistoryItem | null> => {
        // The evaluation itself is already persisted server-side by /evaluate/azure/sync
        // (see user-story/page.tsx), so here we just refresh from the backend and hand
        // back the freshly-saved row instead of re-posting anything.
        await fetchHistory()
        const res = await fetch(`/api/user-stories?page=1&limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => null)
        const latest = data?.items?.[0]
        return latest ? mapRow(latest) : null
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
        <HistoryContext.Provider value={{
            historyItems, loading, teams, teamFilter, setTeamFilter,
            refresh: fetchHistory, addHistoryItem, removeHistoryItem, removeWorkItem,
        }}>
            {children}
        </HistoryContext.Provider>
    )
}

export function useHistory() {
    const ctx = useContext(HistoryContext)
    if (!ctx) throw new Error("useHistory must be used inside HistoryProvider")
    return ctx
}