export type AchievementId = 'NEWBIE' | 'BULLSEYE' | 'THE_SNIPER' | 'BATMAN' | 'GHOST' | 'UNLUCKY'

export type LastSubmission = {
  azure_work_item_id: string
  score: number
  code_quality: number
  failed_criteria: string[]
}

export type Achievement = {
  id: AchievementId
  name: string
  description: string
  requirement: string
  color: string
  textColor: string
  check: ((lastSubmissions: LastSubmission[]) => boolean) | null
  progress: ((lastSubmissions: LastSubmission[]) => [number, number]) | null
}

export type AchievementResult = {
  id: AchievementId
  name: string
  description: string
  requirement: string
  color: string
  textColor: string
  unlocked: boolean
  progress: [number, number] | null
}

const isValid = (s: LastSubmission) => s.score >= 70 && s.code_quality >= 50

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'NEWBIE',
    name: 'Newbie',
    description: 'Starting tag. Everyone begins here.',
    requirement: 'Always unlocked.',
    color: '#9ca3af',
    textColor: '#fff',
    check: null,
    progress: null,
  },
  {
    id: 'BULLSEYE',
    name: 'Bullseye',
    description: 'Hit the target dead on.',
    requirement: '5 user stories with score ≥ 70% and quality ≥ 50%.',
    color: '#f59e0b',
    textColor: '#1a1a1a',
    check: (ls) => ls.filter(isValid).length >= 5,
    progress: (ls) => [ls.filter(isValid).length, 5],
  },
  {
    id: 'THE_SNIPER',
    name: 'The Sniper',
    description: 'Maximum precision. No room for error.',
    requirement: '3 user stories with a perfect score of 100%.',
    color: '#dc2626',
    textColor: '#fff',
    check: (ls) => ls.filter(s => s.score === 100).length >= 3,
    progress: (ls) => [ls.filter(s => s.score === 100).length, 3],
  },
  {
    id: 'BATMAN',
    name: 'Batman',
    description: 'Always prepared. A quality veteran.',
    requirement: '10 user stories with score ≥ 70% and quality ≥ 50%.',
    color: '#1e293b',
    textColor: '#fff',
    check: (ls) => ls.filter(isValid).length >= 10,
    progress: (ls) => [ls.filter(isValid).length, 10],
  },
  {
    id: 'GHOST',
    name: 'Ghost',
    description: 'Leaves no trace. Zero failed criteria.',
    requirement: '3 user stories with no failed criteria.',
    color: '#0d9488',
    textColor: '#fff',
    check: (ls) => ls.filter(s => s.failed_criteria.length === 0).length >= 3,
    progress: (ls) => [ls.filter(s => s.failed_criteria.length === 0).length, 3],
  },
  {
    id: 'UNLUCKY',
    name: 'Unlucky',
    description: "Not your day. It happens.",
    requirement: '1 user story with a score below 50%.',
    color: '#a21caf',
    textColor: '#fff',
    check: (ls) => ls.some(s => s.score < 50),
    progress: (ls) => [Math.min(ls.filter(s => s.score < 50).length, 1), 1],
  },
]
