'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useAuth } from '@/app/_context/AuthContext'

export type EquippableAchievement = {
    id: number
    name: string
    color: string
    text_color: string
}

type BackendAchievement = EquippableAchievement & { unlocked_emails: string[] }

type AchievementsContextType = {
    activeTag: string
    setActiveTag: (id: string) => Promise<void>
    hideAchievements: boolean
    setHideAchievements: (v: boolean) => void
    equippableAchievements: EquippableAchievement[]
    equippedAchievement: EquippableAchievement | null
    refreshAchievements: () => void
}

const AchievementsContext = createContext<AchievementsContextType | null>(null)

export function AchievementsProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth()
    const [achievements, setAchievements] = useState<BackendAchievement[]>([])

    const [activeTag, setActiveTagState] = useState<string>(() => {
        if (typeof window === 'undefined') return ''
        return localStorage.getItem('activeTag') ?? ''
    })
    const [hideAchievements, setHideAchievementsState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem('hideAchievements') === 'true'
    })

    function setHideAchievements(v: boolean) {
        setHideAchievementsState(v)
        localStorage.setItem('hideAchievements', String(v))
    }

    // Which tag is equipped has no backend field yet — kept client-side (per-device) in
    // localStorage, but keyed by the achievement's real backend id so it works for ANY
    // achievement (not just a hardcoded list).
    const setActiveTag = async (id: string): Promise<void> => {
        setActiveTagState(id)
        localStorage.setItem('activeTag', id)
    }

    const loadAchievements = () => {
        if (!token) return
        fetch('/api/achievements/list', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setAchievements(data) })
            .catch(() => {})
    }

    useEffect(() => {
        loadAchievements()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const equippableAchievements = useMemo<EquippableAchievement[]>(
        () => achievements
            .filter(a => !!user?.email && a.unlocked_emails.includes(user.email))
            .map(({ id, name, color, text_color }) => ({ id, name, color, text_color })),
        [achievements, user]
    )

    const equippedAchievement = useMemo(
        () => equippableAchievements.find(a => String(a.id) === activeTag) ?? null,
        [equippableAchievements, activeTag]
    )

    return (
        <AchievementsContext.Provider value={{
            activeTag, setActiveTag, hideAchievements, setHideAchievements,
            equippableAchievements, equippedAchievement, refreshAchievements: loadAchievements,
        }}>
            {children}
        </AchievementsContext.Provider>
    )
}

export function useAchievements() {
    const ctx = useContext(AchievementsContext)
    if (!ctx) throw new Error('useAchievements must be used inside AchievementsProvider')
    return ctx
}