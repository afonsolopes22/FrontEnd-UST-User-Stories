'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type AchievementsContextType = {
  activeTag: string
  setActiveTag: (tag: string) => Promise<void>
  hideAchievements: boolean
  setHideAchievements: (v: boolean) => void
}

const AchievementsContext = createContext<AchievementsContextType | null>(null)

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const [activeTag, setActiveTagState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'NEWBIE'
    return localStorage.getItem('activeTag') ?? 'NEWBIE'
  })
  const [hideAchievements, setHideAchievementsState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('hideAchievements') === 'true'
  })

  function setHideAchievements(v: boolean) {
    setHideAchievementsState(v)
    localStorage.setItem('hideAchievements', String(v))
  }

  // Equipped tag has no backend field yet — kept client-side (per-device) in localStorage.
  const setActiveTag = async (tag: string): Promise<void> => {
    setActiveTagState(tag)
    localStorage.setItem('activeTag', tag)
  }

  return (
    <AchievementsContext.Provider value={{ activeTag, setActiveTag, hideAchievements, setHideAchievements }}>
      {children}
    </AchievementsContext.Provider>
  )
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext)
  if (!ctx) throw new Error('useAchievements must be used inside AchievementsProvider')
  return ctx
}
