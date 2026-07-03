'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './settings.module.css'
import { useAuth } from '@/app/_context/AuthContext'
import { useAchievements } from '@/app/_context/AchievementsContext'
import { useNotifications } from '@/app/_context/NotificationsContext'

type Org = {
    id: number
    name: string
    azure_org: string
    azure_pat?: string
    azure_project?: string
    azure_repo_url?: string
}

type Project = {
    id: number
    name: string
    organization_id: number
    azure_project: string
    azure_repo_url: string
}

type Team = {
    id: number
    name: string
    project_id: number
    history_visibility?: 'team' | 'project' | 'organization'
    created_by_user_id?: number | null
}

type BestPractice = {
    id: number
    description?: string
    [key: string]: unknown
}

type Member = {
    user_id: number
    name?: string
    email: string
    role?: string
    organization_id?: number
    project_ids?: number[]
    team_ids?: number[]
}

type SidebarItem = {
    id: string
    label: string
    icon: React.ReactNode
}

const ORG_ITEMS: SidebarItem[] = [
    {
        id: 'organization', label: 'Organization',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    },
    {
        id: 'projects', label: 'Projects',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>,
    },
    {
        id: 'teams', label: 'Teams',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    },
    {
        id: 'pat', label: 'Personal Access Tokens',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
    },
    {
        id: 'users', label: 'Users',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    },
]

const PLATFORM_ITEMS: SidebarItem[] = [
    {
        id: 'ux', label: 'User Experience',
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" /></svg>,
    },
]

const ALL_ITEMS = [...ORG_ITEMS, ...PLATFORM_ITEMS]

function PatGuide() {
    return (
        <div>
            <p className={styles.patGuideHeading}>How to create a PAT</p>
            <p className={styles.patGuideSub}>Follow these steps to create and configure your Personal Access Token.</p>

            <div className={styles.patSteps}>
                {[
                    {
                        title: 'Open PAT settings',
                        body: (
                            <ul className={styles.patStepList}>
                                <li>Click your <span className={styles.kw}>avatar</span> — top-right corner of Azure DevOps</li>
                                <li>Go to <span className={styles.kw}>User settings</span> → <span className={styles.kw}>Personal access tokens</span></li>
                            </ul>
                        ),
                    },
                    {
                        title: 'Create a new token',
                        body: (
                            <ul className={styles.patStepList}>
                                <li>Click <span className={styles.kw}>+ New Token</span> — blue button, top-right</li>
                                <li>Name it — e.g. <code className={styles.tag}>devlens</code></li>
                                <li>Select your <span className={styles.kw}>organisation</span> and set an <em>expiry date</em></li>
                            </ul>
                        ),
                    },
                    {
                        title: 'Set permissions',
                        body: (
                            <ul className={styles.patStepList}>
                                <li>Under <em>Scopes</em>, select <span className={styles.kw}>Custom defined</span></li>
                                <li><span className={styles.kw}>Work Items</span> → Read</li>
                                <li><span className={styles.kw}>Code</span> → Read</li>
                                <li style={{ color: '#aaa' }}>No other scopes required</li>
                            </ul>
                        ),
                    },
                    {
                        title: 'Copy the token',
                        body: (
                            <ul className={styles.patStepList}>
                                <li>Click <span className={styles.kw}>Create</span></li>
                                <li>Copy the token — <span className={styles.warn}>show only once</span></li>
                                <li>Paste it in the <span className={styles.kw}>PAT field</span> on the left</li>
                            </ul>
                        ),
                    },
                ].map((step, i, arr) => (
                    <div key={i} className={styles.patStep}>
                        <div className={styles.patStepLeft}>
                            <div className={styles.patStepCircle}>{i + 1}</div>
                            {i < arr.length - 1 && <div className={styles.patStepConnector} />}
                        </div>
                        <div className={i < arr.length - 1 ? styles.patStepBody : styles.patStepBodyLast}>
                            <p className={styles.patStepTitle}>{step.title}</p>
                            {step.body}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.patTips}>
                <p className={styles.patTipsTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Tips
                </p>
                <ul className={styles.patTipsList}>
                    <li>Only <span className={styles.kw}>Read</span> is needed — never grant more than necessary</li>
                    <li>Tokens <span className={styles.warn}>expire</span> — renew before the expiry date</li>
                    <li>New to Azure DevOps? <a href="/faq" className={styles.faqLink}>Read the full tutorial in FAQ →</a></li>
                </ul>
            </div>
        </div>
    )
}

function Placeholder({ item }: { item: SidebarItem | undefined }) {
    return (
        <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>
                <span style={{ color: '#9ca3af' }}>{item?.icon}</span>
            </div>
            <p className={styles.placeholderTitle}>{item?.label}</p>
            <p className={styles.placeholderDesc}>This section is not yet available.</p>
        </div>
    )
}

// ─── Standalone org info card (shown at the top of the Organization tab) ─────
function OrgInfoCard({ org }: { org: Org }) {
    return (
        <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #f5f3ff 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            marginBottom: '1.5rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Active Organization
                </p>
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Name</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{org.name}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Azure Organization</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{org.azure_org}</p>
                </div>
                {org.azure_project && (
                    <div>
                        <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Azure Project</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{org.azure_project}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const { user, token, status, updateUser, refreshUser } = useAuth()
    const { hideAchievements, setHideAchievements } = useAchievements()
    const { refresh: refreshNotifications } = useNotifications()
    const role = user?.role
    const patRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [activeSection, setActiveSection] = useState('organization')
    const [currentOrg, setCurrentOrg] = useState<Org | null>(null)
    const [loadingOrg, setLoadingOrg] = useState(true)

    // Organization form state
    const [name, setName] = useState('')
    const [azureOrg, setAzureOrg] = useState('')
    const [azurePat, setAzurePat] = useState('')
    const [showPat, setShowPat] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({ name: false, azureOrg: false, azurePat: false })
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Projects state
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [projectsError, setProjectsError] = useState<string | null>(null)
    const [showNewProjectForm, setShowNewProjectForm] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [newAzureProject, setNewAzureProject] = useState('')
    const [newAzureRepoUrl, setNewAzureRepoUrl] = useState('')
    const [projectFormErrors, setProjectFormErrors] = useState({ name: false, azureProject: false, azureRepoUrl: false })
    const [savingProject, setSavingProject] = useState(false)
    const [saveProjectError, setSaveProjectError] = useState<string | null>(null)
    const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null)

    // Project → Teams expansion
    const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null)
    const [projectTeams, setProjectTeams] = useState<Record<number, Team[]>>({})
    const [loadingTeams, setLoadingTeams] = useState<Record<number, boolean>>({})

    // New team form (per project)
    const [showNewTeamProjectId, setShowNewTeamProjectId] = useState<number | null>(null)
    const [newTeamName, setNewTeamName] = useState('')
    const [savingTeam, setSavingTeam] = useState(false)
    const [saveTeamError, setSaveTeamError] = useState<string | null>(null)

    // Project → Best Practices
    const BEST_PRACTICES_PAGE_SIZE = 5
    const [projectBestPractices, setProjectBestPractices] = useState<Record<number, BestPractice[]>>({})
    const [bestPracticesPage, setBestPracticesPage] = useState<Record<number, number>>({})
    const [bestPracticesMeta, setBestPracticesMeta] = useState<Record<number, { total: number; pages: number }>>({})
    const [loadingBestPractices, setLoadingBestPractices] = useState<Record<number, boolean>>({})
    const [showNewBestPracticeProjectId, setShowNewBestPracticeProjectId] = useState<number | null>(null)
    const [newBestPracticeText, setNewBestPracticeText] = useState('')
    const [savingBestPractice, setSavingBestPractice] = useState(false)
    const [saveBestPracticeError, setSaveBestPracticeError] = useState<string | null>(null)
    const [deletingBestPracticeId, setDeletingBestPracticeId] = useState<number | null>(null)

    // Teams tab state
    const [allProjects, setAllProjects] = useState<Project[]>([])
    const [allTeams, setAllTeams] = useState<Record<number, Team[]>>({}) // keyed by project_id
    const [loadingAllTeams, setLoadingAllTeams] = useState(false)
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
    const [teamMembers, setTeamMembers] = useState<Record<number, Member[]>>({})
    const [loadingMembers, setLoadingMembers] = useState<Record<number, boolean>>({})
    const [newMemberEmail, setNewMemberEmail] = useState<Record<number, string>>({})
    const [addingMember, setAddingMember] = useState<number | null>(null)
    const [addMemberError, setAddMemberError] = useState<Record<number, string | null>>({})
    const [deletingMember, setDeletingMember] = useState<{ teamId: number; userId: number } | null>(null)
    const [savingVisibility, setSavingVisibility] = useState<number | null>(null)
    const [visibilityError, setVisibilityError] = useState<Record<number, string | null>>({})

    // Create-team form available directly in the Teams tab (not just nested under a project)
    const [showGlobalTeamForm, setShowGlobalTeamForm] = useState(false)
    const [globalTeamProjectId, setGlobalTeamProjectId] = useState<number | null>(null)
    const [globalTeamName, setGlobalTeamName] = useState('')
    const [savingGlobalTeam, setSavingGlobalTeam] = useState(false)
    const [globalTeamError, setGlobalTeamError] = useState<string | null>(null)

    // PAT reveal state
    const [showRevealForm, setShowRevealForm] = useState(false)
    const [patPassword, setPatPassword] = useState('')
    const [showPatPassword, setShowPatPassword] = useState(false)
    const [patRevealError, setPatRevealError] = useState<string | null>(null)
    const [revealedPat, setRevealedPat] = useState<string | null>(null)
    const [revealingPat, setRevealingPat] = useState(false)
    const [patCopied, setPatCopied] = useState(false)

    // Persist org to localStorage so other pages (analyze, user-story) can read it
    useEffect(() => {
        if (currentOrg) localStorage.setItem('current_org', JSON.stringify(currentOrg))
    }, [currentOrg])

    // Load current org — organization_id always comes from /auth/me (backend)
    useEffect(() => {
        if (status === 'loading' || !token) {
            if (status !== 'loading') setLoadingOrg(false)
            return
        }
        if (!user?.organization_id) {
            setLoadingOrg(false)
            return
        }
        setLoadingOrg(true)
        fetch('/api/organizations', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((orgs: Org[]) => {
                if (!Array.isArray(orgs)) return
                const org = orgs.find(o => o.id === user.organization_id)
                if (org) setCurrentOrg(org)
            })
            .finally(() => setLoadingOrg(false))
    }, [status, token, user?.organization_id])

    // Load projects when Projects tab is active
    useEffect(() => {
        if (activeSection !== 'projects' || !user?.organization_id || !token) return
        setLoadingProjects(true)
        setProjectsError(null)
        fetch(`/api/organizations/${user.organization_id}/projects`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => setProjects(Array.isArray(data) ? data : []))
            .catch(() => setProjectsError('Failed to load projects.'))
            .finally(() => setLoadingProjects(false))
    }, [activeSection, user?.organization_id, token])

    // Load all teams for Teams tab
    useEffect(() => {
        if (activeSection !== 'teams' || !user?.organization_id || !token) return
        setLoadingAllTeams(true)
        fetch(`/api/organizations/${user.organization_id}/projects`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(async (projectList: Project[]) => {
                if (!Array.isArray(projectList)) return
                setAllProjects(projectList)
                const entries = await Promise.all(
                    projectList.map(async p => {
                        const r = await fetch(`/api/projects/${p.id}/teams`, { headers: { Authorization: `Bearer ${token}` } })
                        const teams: Team[] = r.ok ? await r.json() : []
                        return [p.id, Array.isArray(teams) ? teams : []] as [number, Team[]]
                    })
                )
                setAllTeams(Object.fromEntries(entries))
            })
            .finally(() => setLoadingAllTeams(false))
    }, [activeSection, user?.organization_id, token])

    async function handleSave() {
        const errors = {
            name: !name.trim(), azureOrg: !azureOrg.trim(), azurePat: !azurePat.trim(),
        }
        setFieldErrors(errors)
        if (Object.values(errors).some(Boolean)) return
        setSaveError(null); setSaveSuccess(false); setSaving(true)
        try {
            // Check if an org with matching azure_org already exists to avoid duplicates
            const listRes = await fetch('/api/organizations', { headers: { Authorization: `Bearer ${token}` } })
            const orgs: Org[] = listRes.ok ? await listRes.json() : []
            const existing = Array.isArray(orgs) ? orgs.find(o => o.azure_pat === azurePat.trim()) : null

            let orgId: number
            if (existing) {
                orgId = existing.id
                setCurrentOrg({
                    id: existing.id,
                    name: existing.name,
                    azure_org: existing.azure_org,
                    azure_project: existing.azure_project,
                    azure_repo_url: existing.azure_repo_url,
                })
            } else {
                const res = await fetch('/api/organizations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name, azure_org: azureOrg, azure_pat: azurePat }),
                })
                const data = await res.json()
                if (!res.ok) { setSaveError(data.error || data.detail || `Failed to save organization (${res.status}).`); return }
                orgId = data.id
                setCurrentOrg({ id: data.id, name: name.trim(), azure_org: azureOrg.trim() })
            }

            // Persist the association in the backend so /auth/me returns the correct organization_id
            const patchRes = await fetch(`/api/auth/me/organization?organization_id=${orgId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!patchRes.ok) {
                const errData = await patchRes.json().catch(() => null)
                setSaveError(errData?.error ?? errData?.detail ?? `Failed to associate organization (${patchRes.status}).`)
                return
            }
            const updatedUser = await patchRes.json()
            updateUser(updatedUser)

            // Reset stale org-specific data so Projects/Teams reload for the new org
            setProjects([]); setProjectTeams({}); setAllTeams({}); setTeamMembers({})
            setAllProjects([]); setExpandedProjectId(null); setExpandedTeamId(null)
            setProjectBestPractices({}); setBestPracticesPage({}); setBestPracticesMeta({})

            sessionStorage.setItem('org_pat', azurePat)
            setName(''); setAzureOrg(''); setAzurePat('')
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 4000)
            refreshNotifications()
        } catch { setSaveError('Unexpected error. Please try again.') }
        finally { setSaving(false) }
    }

    async function handleDelete() {
        setDeleteError(null); setDeleting(true)
        try {
            const orgId = currentOrg?.id ?? user?.organization_id
            const res = await fetch(`/api/organizations?org_id=${orgId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (!res.ok) { const data = await res.json().catch(() => null); setDeleteError(data?.error ?? data?.detail ?? `Failed to delete (${res.status}).`); return }
            setCurrentOrg(null)
            localStorage.removeItem('current_org')
            // Reset all org-specific cached data so nothing from the old org leaks
            setProjects([]); setProjectTeams({}); setAllTeams({}); setTeamMembers({})
            setAllProjects([]); setExpandedProjectId(null); setExpandedTeamId(null)
            setProjectBestPractices({}); setBestPracticesPage({}); setBestPracticesMeta({})
            setShowConfirm(false)
            await refreshUser()
            refreshNotifications()
        } catch { setDeleteError('Unexpected error. Please try again.') }
        finally { setDeleting(false) }
    }

    async function handleCreateProject() {
        const errors = {
            name: !newProjectName.trim(),
            azureProject: !newAzureProject.trim(),
            azureRepoUrl: !newAzureRepoUrl.trim(),
        }
        setProjectFormErrors(errors)
        if (Object.values(errors).some(Boolean)) return
        setSaveProjectError(null); setSavingProject(true)
        try {
            const orgId = user!.organization_id
            const res = await fetch(`/api/organizations/${orgId}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newProjectName,
                    azure_project: newAzureProject,
                    azure_repo_url: newAzureRepoUrl,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setSaveProjectError(data.error || data.detail || `Failed to create project (${res.status}).`); return }
            setProjects(prev => [...prev, data])
            setShowNewProjectForm(false)
            setNewProjectName(''); setNewAzureProject(''); setNewAzureRepoUrl('')
            refreshNotifications()
        } catch { setSaveProjectError('Unexpected error. Please try again.') }
        finally { setSavingProject(false) }
    }

    async function handleDeleteProject(projectId: number) {
        setDeletingProjectId(projectId)
        try {
            const orgId = user!.organization_id
            const res = await fetch(`/api/organizations/${orgId}/projects/${projectId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return
            setProjects(prev => prev.filter(p => p.id !== projectId))
            if (expandedProjectId === projectId) setExpandedProjectId(null)
            refreshNotifications()
        } finally {
            setDeletingProjectId(null)
        }
    }

    async function loadProjectTeams(projectId: number) {
        if (projectTeams[projectId] !== undefined) return
        setLoadingTeams(prev => ({ ...prev, [projectId]: true }))
        try {
            const r = await fetch(`/api/projects/${projectId}/teams`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await r.json()
            setProjectTeams(prev => ({ ...prev, [projectId]: Array.isArray(data) ? data : [] }))
        } finally {
            setLoadingTeams(prev => ({ ...prev, [projectId]: false }))
        }
    }

    function toggleProject(projectId: number) {
        if (expandedProjectId === projectId) {
            setExpandedProjectId(null)
        } else {
            setExpandedProjectId(projectId)
            loadProjectTeams(projectId)
            loadProjectBestPractices(projectId, 1)
        }
    }

    async function loadProjectBestPractices(projectId: number, page = 1) {
        setLoadingBestPractices(prev => ({ ...prev, [projectId]: true }))
        try {
            const orgId = user!.organization_id
            const r = await fetch(`/api/organizations/${orgId}/projects/${projectId}/best-practices?page=${page}&limit=${BEST_PRACTICES_PAGE_SIZE}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await r.json()
            setProjectBestPractices(prev => ({ ...prev, [projectId]: Array.isArray(data?.best_practices) ? data.best_practices : [] }))
            setBestPracticesMeta(prev => ({ ...prev, [projectId]: { total: data?.total ?? 0, pages: data?.pages ?? 1 } }))
            setBestPracticesPage(prev => ({ ...prev, [projectId]: data?.page ?? page }))
        } finally {
            setLoadingBestPractices(prev => ({ ...prev, [projectId]: false }))
        }
    }

    async function handleCreateBestPractices(projectId: number) {
        const descriptions = newBestPracticeText.split('\n').map(s => s.trim()).filter(Boolean)
        if (descriptions.length === 0) return
        setSavingBestPractice(true); setSaveBestPracticeError(null)
        try {
            const orgId = user!.organization_id
            const res = await fetch(`/api/organizations/${orgId}/projects/${projectId}/best-practices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ descriptions }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setSaveBestPracticeError(data?.error || data?.detail || `Failed (${res.status}).`)
                return
            }
            // Response shape from backend is not a reliable list — refetch page 1 to stay in sync.
            await loadProjectBestPractices(projectId, 1)
            setNewBestPracticeText('')
            setShowNewBestPracticeProjectId(null)
        } catch { setSaveBestPracticeError('Unexpected error.') }
        finally { setSavingBestPractice(false) }
    }

    async function handleDeleteBestPractice(projectId: number, practiceId: number) {
        setDeletingBestPracticeId(practiceId)
        try {
            const orgId = user!.organization_id
            const res = await fetch(`/api/organizations/${orgId}/projects/${projectId}/best-practices/${practiceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return
            const currentPage = bestPracticesPage[projectId] ?? 1
            const remainingOnPage = (projectBestPractices[projectId] ?? []).filter(bp => bp.id !== practiceId).length
            const nextPage = remainingOnPage === 0 && currentPage > 1 ? currentPage - 1 : currentPage
            await loadProjectBestPractices(projectId, nextPage)
        } finally {
            setDeletingBestPracticeId(null)
        }
    }

    async function handleCreateTeam(projectId: number) {
        if (!newTeamName.trim()) return
        setSavingTeam(true); setSaveTeamError(null)
        try {
            const res = await fetch(`/api/projects/${projectId}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newTeamName, organization_id: user!.organization_id }),
            })
            const data = await res.json()
            if (!res.ok) { setSaveTeamError(data.error || data.detail || `Failed (${res.status}).`); return }
            setProjectTeams(prev => ({ ...prev, [projectId]: [...(prev[projectId] ?? []), data] }))
            setNewTeamName('')
            setShowNewTeamProjectId(null)
            refreshNotifications()
        } catch { setSaveTeamError('Unexpected error.') }
        finally { setSavingTeam(false) }
    }

    async function handleDeleteTeam(projectId: number, teamId: number) {
        const res = await fetch(`/api/projects/${projectId}/teams/${teamId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
            setProjectTeams(prev => ({
                ...prev,
                [projectId]: (prev[projectId] ?? []).filter(t => t.id !== teamId),
            }))
            // Also refresh allTeams if loaded
            setAllTeams(prev => ({
                ...prev,
                [projectId]: (prev[projectId] ?? []).filter(t => t.id !== teamId),
            }))
            refreshNotifications()
        }
    }

    async function handleUpdateVisibility(projectId: number, teamId: number, visibility: 'team' | 'project' | 'organization') {
        setSavingVisibility(teamId)
        setVisibilityError(prev => ({ ...prev, [teamId]: null }))
        try {
            const res = await fetch(`/api/projects/${projectId}/teams/${teamId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ history_visibility: visibility }),
            })
            const data = await res.json()
            if (!res.ok) {
                setVisibilityError(prev => ({ ...prev, [teamId]: data.error || data.detail || `Failed (${res.status}).` }))
                return
            }
            const patchTeam = (list: Team[]) => list.map(t => t.id === teamId ? { ...t, history_visibility: visibility } : t)
            setProjectTeams(prev => ({ ...prev, [projectId]: patchTeam(prev[projectId] ?? []) }))
            setAllTeams(prev => ({ ...prev, [projectId]: patchTeam(prev[projectId] ?? []) }))
        } catch {
            setVisibilityError(prev => ({ ...prev, [teamId]: 'Unexpected error.' }))
        } finally {
            setSavingVisibility(null)
        }
    }

    async function handleCreateTeamGlobal() {
        if (!globalTeamProjectId) { setGlobalTeamError('Choose a project.'); return }
        if (!globalTeamName.trim()) { setGlobalTeamError('Team name is required.'); return }
        setSavingGlobalTeam(true)
        setGlobalTeamError(null)
        try {
            const res = await fetch(`/api/projects/${globalTeamProjectId}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: globalTeamName.trim(), organization_id: user!.organization_id }),
            })
            const data = await res.json()
            if (!res.ok) {
                setGlobalTeamError(data.error || data.detail || `Failed (${res.status}).`)
                return
            }
            const pid = globalTeamProjectId
            setAllTeams(prev => ({ ...prev, [pid]: [...(prev[pid] ?? []), data] }))
            setProjectTeams(prev => ({ ...prev, [pid]: [...(prev[pid] ?? []), data] }))
            setGlobalTeamName('')
            setGlobalTeamProjectId(null)
            setShowGlobalTeamForm(false)
            refreshNotifications()
        } catch {
            setGlobalTeamError('Unexpected error.')
        } finally {
            setSavingGlobalTeam(false)
        }
    }

    function navigateToTeam(team: Team) {
        setActiveSection('teams')
        setExpandedTeamId(team.id)
        loadTeamMembers(team.id)
    }

    async function loadTeamMembers(teamId: number) {
        if (teamMembers[teamId] !== undefined) return
        setLoadingMembers(prev => ({ ...prev, [teamId]: true }))
        try {
            const r = await fetch(`/api/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await r.json()
            setTeamMembers(prev => ({ ...prev, [teamId]: Array.isArray(data) ? data : [] }))
        } finally {
            setLoadingMembers(prev => ({ ...prev, [teamId]: false }))
        }
    }

    function toggleTeam(teamId: number) {
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null)
        } else {
            setExpandedTeamId(teamId)
            loadTeamMembers(teamId)
        }
    }

    async function handleAddMember(teamId: number) {
        const email = (newMemberEmail[teamId] ?? '').trim()
        if (!email) return
        setAddingMember(teamId)
        setAddMemberError(prev => ({ ...prev, [teamId]: null }))
        try {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) {
                setAddMemberError(prev => ({ ...prev, [teamId]: data.error || data.detail || `Failed (${res.status}).` }))
                return
            }
            // Add the new member directly from the response — avoids an extra GET
            const newMember: Member = {
                user_id: data.user_id,
                email: data.email,
                name: data.name,
                organization_id: data.organization_id,
                project_ids: data.project_ids,
                team_ids: data.team_ids,
            }
            setTeamMembers(prev => ({
                ...prev,
                [teamId]: [...(prev[teamId] ?? []), newMember],
            }))
            setNewMemberEmail(prev => ({ ...prev, [teamId]: '' }))
            refreshNotifications()
        } catch {
            setAddMemberError(prev => ({ ...prev, [teamId]: 'Unexpected error.' }))
        } finally {
            setAddingMember(null)
        }
    }

    async function handleDeleteMember(teamId: number, userId: number) {
        setDeletingMember({ teamId, userId })
        try {
            const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                setTeamMembers(prev => ({
                    ...prev,
                    [teamId]: (prev[teamId] ?? []).filter(m => m.user_id !== userId),
                }))
                refreshNotifications()
            }
        } finally {
            setDeletingMember(null)
        }
    }

    async function handleRevealPat() {
        if (!patPassword.trim()) { setPatRevealError('Password is required.'); return }
        setRevealingPat(true); setPatRevealError(null)
        try {
            const res = await fetch('https://tfc-userstories.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user!.email, password: patPassword }),
            })
            if (!res.ok) { setPatRevealError('Incorrect password.'); return }
            const stored = sessionStorage.getItem('org_pat')
            if (stored) {
                setRevealedPat(stored)
                setShowRevealForm(false)
                setPatPassword('')
                if (patRevealTimer.current) clearTimeout(patRevealTimer.current)
                patRevealTimer.current = setTimeout(() => setRevealedPat(null), 3000)
            } else {
                setPatRevealError('PAT not available in this session. Re-save your organization to access it.')
            }
        } catch { setPatRevealError('Failed to verify. Try again.') }
        finally { setRevealingPat(false) }
    }

    function handleCopyPat() {
        if (!revealedPat) return
        navigator.clipboard.writeText(revealedPat).then(() => {
            setPatCopied(true)
            setTimeout(() => setPatCopied(false), 2000)
        })
    }

    const activeItem = ALL_ITEMS.find(i => i.id === activeSection)

    function NavItem({ item, badge }: { item: SidebarItem; badge?: number }) {
        const isActive = activeSection === item.id
        return (
            <li>
                <button className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`} onClick={() => setActiveSection(item.id)}>
                    <span className={styles.navItemIcon} style={{ color: isActive ? '#1d4ed8' : '#9ca3af' }}>{item.icon}</span>
                    {item.label}
                    {badge != null && badge > 0 && (
                        <span style={{
                            marginLeft: 'auto', background: '#ef4444', color: '#fff',
                            fontSize: 10, fontWeight: 700, borderRadius: 9999,
                            padding: '1px 6px', lineHeight: 1.6, minWidth: 16, textAlign: 'center',
                        }}>
              {badge > 99 ? '99+' : badge}
            </span>
                    )}
                </button>
            </li>
        )
    }

    // ─── Inline team row in Projects tab ─────────────────────────────────────
    function TeamRow({ team, projectId }: { team: Team; projectId: number }) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 6, background: '#f9fafb',
                border: '1px solid #e5e7eb', marginBottom: 4,
            }}>
                <button
                    onClick={() => navigateToTeam(team)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, color: '#1d4ed8', fontWeight: 500, textAlign: 'left', flex: 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                    title="Go to Teams tab"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    {team.name}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
                {role === 'admin' && (
                    <button
                        onClick={() => handleDeleteTeam(projectId, team.id)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ef4444', padding: '2px 4px', borderRadius: 4,
                        }}
                        title="Delete team"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                    </button>
                )}
            </div>
        )
    }

    // ─── Teams tab: team card with members ───────────────────────────────────
    function TeamCard({ team, projectName }: { team: Team; projectName: string }) {
        const isExpanded = expandedTeamId === team.id
        const members = teamMembers[team.id] ?? []
        const isLoadingMembers = loadingMembers[team.id]
        const memberEmail = newMemberEmail[team.id] ?? ''
        const memberError = addMemberError[team.id] ?? null

        return (
            <div style={{
                border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
                marginBottom: 8,
                transition: 'box-shadow 0.15s',
                boxShadow: isExpanded ? '0 2px 8px rgba(0,0,0,0.07)' : 'none',
            }}>
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: isExpanded ? '#f5f3ff' : '#fafafa',
                        padding: '10px 14px',
                        fontSize: 13, fontWeight: 600, color: '#111',
                        transition: 'background 0.1s',
                    }}
                >
                    <button
                        onClick={() => toggleTeam(team.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, flex: 1, textAlign: 'left',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            fontSize: 13, fontWeight: 600, color: '#111',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? '#7c3aed' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                        {team.name}
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>{projectName}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {role === 'admin' && (
                            <button
                                onClick={() => handleDeleteTeam(team.project_id, team.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#ef4444', padding: '3px 4px', borderRadius: 4, display: 'flex',
                                }}
                                title="Delete team"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => toggleTeam(team.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', display: 'flex' }}
                        >
                            <svg
                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                            marginBottom: 12, padding: '8px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #eee',
                        }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>History visibility</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                                    How much of the submission history members of this team can see in their Dashboard.
                                </p>
                            </div>
                            {role === 'admin' ? (
                                <select
                                    value={team.history_visibility ?? 'team'}
                                    disabled={savingVisibility === team.id}
                                    onChange={e => handleUpdateVisibility(team.project_id, team.id, e.target.value as 'team' | 'project' | 'organization')}
                                    className={styles.fieldInput}
                                    style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                                >
                                    <option value="team">Team only</option>
                                    <option value="project">Whole project</option>
                                    <option value="organization">Whole organization</option>
                                </select>
                            ) : (
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#5236ab', textTransform: 'capitalize' }}>
                  {(team.history_visibility ?? 'team') === 'team' ? 'Team only' : (team.history_visibility === 'project' ? 'Whole project' : 'Whole organization')}
                </span>
                            )}
                        </div>
                        {visibilityError[team.id] && (
                            <p className={styles.saveError} style={{ marginTop: -6, marginBottom: 10, fontSize: 12 }}>{visibilityError[team.id]}</p>
                        )}

                        {isLoadingMembers ? (
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Loading members…</p>
                        ) : members.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 10px' }}>No members yet.</p>
                        ) : (
                            <div style={{ marginBottom: 10 }}>
                                {members.map(m => (
                                    <div key={m.user_id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '5px 8px', borderRadius: 6, fontSize: 13,
                                        borderBottom: '1px solid #f3f4f6',
                                    }}>
                    <span style={{ color: '#374151' }}>
                      {m.name && <strong style={{ marginRight: 6 }}>{m.name}</strong>}
                        <span style={{ color: '#6b7280' }}>{m.email}</span>
                        {team.created_by_user_id === m.user_id && (
                            <span style={{
                                marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
                                background: '#ede9fe', color: '#5236ab', textTransform: 'uppercase', letterSpacing: '0.03em',
                            }}>
                          Owner
                        </span>
                        )}
                    </span>
                                        {role === 'admin' && team.created_by_user_id !== m.user_id && (
                                            <button
                                                onClick={() => handleDeleteMember(team.id, m.user_id)}
                                                disabled={deletingMember?.teamId === team.id && deletingMember?.userId === m.user_id}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#ef4444', padding: '2px 4px', borderRadius: 4, flexShrink: 0,
                                                }}
                                                title="Remove member"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {role === 'admin' && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <input
                                    type="email"
                                    placeholder="member@email.com"
                                    value={memberEmail}
                                    onChange={e => setNewMemberEmail(prev => ({ ...prev, [team.id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddMember(team.id)}
                                    className={styles.fieldInput}
                                    style={{ flex: 1, minWidth: 180, fontSize: 12, padding: '5px 10px' }}
                                />
                                <button
                                    className={styles.saveBtn}
                                    style={{ marginTop: 0, padding: '5px 12px', fontSize: 12 }}
                                    onClick={() => handleAddMember(team.id)}
                                    disabled={addingMember === team.id}
                                >
                                    {addingMember === team.id ? 'Adding…' : '+ Add'}
                                </button>
                            </div>
                        )}
                        {memberError && <p className={styles.saveError} style={{ marginTop: 6, fontSize: 12 }}>{memberError}</p>}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={styles.shell}>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <h1 className={styles.sidebarTitle}>Settings</h1>
                    <p className={styles.sidebarSubtitle}>Manage your organizations, integrations and platform settings.</p>
                </div>

                <div className={styles.sidebarSection}>
                    <p className={styles.sidebarSectionLabel}>Organization</p>
                </div>
                <ul className={styles.navList}>
                    {ORG_ITEMS.filter(item => item.id !== 'pat' || role === 'admin').map(item => <NavItem key={item.id} item={item} />)}
                </ul>

                <div className={styles.sidebarSection} style={{ marginTop: '0.5rem' }}>
                    <p className={styles.sidebarSectionLabel}>Platform</p>
                </div>
                <ul className={styles.navList}>
                    {PLATFORM_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
                </ul>

                <div className={styles.sidebarSpacer} />

                <div className={styles.sidebarHelp}>
                    <p className={styles.sidebarHelpTitle}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Need help?
                    </p>
                    <p className={styles.sidebarHelpDesc}>Check our documentation or contact support.</p>
                    <a href="/faq" className={styles.sidebarHelpLink}>
                        Visit Help Center
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>
                </div>
            </aside>

            {/* Main */}
            <div className={styles.main}>

                {/* Top org bar — admin only */}
                {role === 'admin' && (loadingOrg || currentOrg) && (
                    <div className={styles.topBar}>
                        {loadingOrg ? (
                            <div className={styles.topBarFields}>
                                <div className={styles.topBarSkeleton} />
                                <div className={styles.topBarSkeleton} />
                                <div className={styles.topBarSkeleton} />
                            </div>
                        ) : currentOrg && (
                            <>
                                <div className={styles.topBarFields}>
                  <span className={styles.topBarField}>
                    <span className={styles.topBarLabel}>Organization:</span>
                    <span className={styles.topBarValue}>{currentOrg.name}</span>
                  </span>
                                    <span className={styles.topBarField}>
                    <span className={styles.topBarLabel}>Org:</span>
                    <span className={styles.topBarValue}>{currentOrg.azure_org}</span>
                  </span>
                                    {currentOrg.azure_project && (
                                        <span className={styles.topBarField}>
                      <span className={styles.topBarLabel}>Project:</span>
                      <span className={styles.topBarValue}>{currentOrg.azure_project}</span>
                    </span>
                                    )}
                                </div>
                                <button className={styles.deleteOrgBtn} onClick={() => setShowConfirm(true)}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                    </svg>
                                    Delete Organization
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ── Organization tab ──────────────────────────────────────────────── */}
                {activeSection === 'organization' ? (
                    role === 'developer' ? (
                        <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr' }}>
                            <div className={styles.formCard}>
                                {loadingOrg ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div className={styles.topBarSkeleton} style={{ height: 80, borderRadius: 12 }} />
                                    </div>
                                ) : currentOrg ? (
                                    <OrgInfoCard org={currentOrg} />
                                ) : null}
                                <h2 className={styles.formTitle}>Organization</h2>
                                <p className={styles.formSubtitle}>
                                    Ask your organization Admin to add you to a Team to get started.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.contentArea}>
                            <div className={styles.formCard}>
                                {/* Org info card — always at the top when org exists */}
                                {loadingOrg ? (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div className={styles.topBarSkeleton} style={{ height: 84, borderRadius: 12 }} />
                                    </div>
                                ) : currentOrg ? (
                                    <OrgInfoCard org={currentOrg} />
                                ) : null}

                                <h2 className={styles.formTitle}>{currentOrg ? 'Change Organization' : 'Add Organization'}</h2>
                                <p className={styles.formSubtitle}>
                                    {currentOrg ? 'Registering a new organization replaces the current one.' : 'Connect an Azure DevOps organization to start evaluating.'}
                                </p>

                                <div className={styles.fieldGroup}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Name</label>
                                        <input className={`${styles.fieldInput} ${fieldErrors.name ? styles.fieldInputError : ''}`} value={name} onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: false })) }} placeholder="my_org" />
                                        {fieldErrors.name && <p className={styles.fieldError}>Required.</p>}
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Azure Organization</label>
                                        <input className={`${styles.fieldInput} ${fieldErrors.azureOrg ? styles.fieldInputError : ''}`} value={azureOrg} onChange={e => { setAzureOrg(e.target.value); setFieldErrors(p => ({ ...p, azureOrg: false })) }} placeholder="org" />
                                        {fieldErrors.azureOrg && <p className={styles.fieldError}>Required.</p>}
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Personal Access Token (PAT)</label>
                                        <div className={styles.patInputWrap}>
                                            <input
                                                className={`${styles.fieldInput} ${fieldErrors.azurePat ? styles.fieldInputError : ''}`}
                                                type={showPat ? 'text' : 'password'}
                                                value={azurePat}
                                                onChange={e => { setAzurePat(e.target.value); setFieldErrors(p => ({ ...p, azurePat: false })) }}
                                                placeholder="••••••••••••••••••••"
                                            />
                                            <button className={styles.patToggle} type="button" onClick={() => setShowPat(v => !v)} tabIndex={-1}>
                                                {showPat ? (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {fieldErrors.azurePat && <p className={styles.fieldError}>Required.</p>}
                                    </div>

                                </div>

                                {saveError && <p className={styles.saveError}>{saveError}</p>}
                                {saveSuccess && (
                                    <p style={{ fontSize: 13, color: '#15803d', fontWeight: 500, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Organization saved successfully.
                                    </p>
                                )}

                                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    {saving ? 'Saving…' : 'Save Organization'}
                                </button>
                            </div>

                            {/* PAT guide */}
                            <div className={styles.patPanel}>
                                <PatGuide />
                            </div>
                        </div>
                    )

                    /* ── Projects tab ──────────────────────────────────────────────────── */
                ) : activeSection === 'projects' ? (
                    role === 'admin' ? (
                        <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr' }}>
                            <div className={styles.formCard}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                    <div>
                                        <h2 className={styles.formTitle}>Projects</h2>
                                        <p className={styles.formSubtitle}>Manage Azure DevOps projects for your organization.</p>
                                    </div>
                                    <button
                                        className={styles.saveBtn}
                                        style={{ marginTop: 0, flexShrink: 0 }}
                                        onClick={() => { setShowNewProjectForm(v => !v); setSaveProjectError(null) }}
                                    >
                                        {showNewProjectForm ? 'Cancel' : '+ New Project'}
                                    </button>
                                </div>

                                {/* Inline new-project form */}
                                {showNewProjectForm && (
                                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                                        <div className={styles.fieldGroup}>
                                            <div className={styles.field}>
                                                <label className={styles.fieldLabel}>Name</label>
                                                <input
                                                    className={`${styles.fieldInput} ${projectFormErrors.name ? styles.fieldInputError : ''}`}
                                                    value={newProjectName}
                                                    onChange={e => { setNewProjectName(e.target.value); setProjectFormErrors(p => ({ ...p, name: false })) }}
                                                    placeholder="my-project"
                                                />
                                                {projectFormErrors.name && <p className={styles.fieldError}>Required.</p>}
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.fieldLabel}>Azure Project</label>
                                                <input
                                                    className={`${styles.fieldInput} ${projectFormErrors.azureProject ? styles.fieldInputError : ''}`}
                                                    value={newAzureProject}
                                                    onChange={e => { setNewAzureProject(e.target.value); setProjectFormErrors(p => ({ ...p, azureProject: false })) }}
                                                    placeholder="project"
                                                />
                                                {projectFormErrors.azureProject && <p className={styles.fieldError}>Required.</p>}
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.fieldLabel}>Azure Repo URL</label>
                                                <input
                                                    className={`${styles.fieldInput} ${projectFormErrors.azureRepoUrl ? styles.fieldInputError : ''}`}
                                                    value={newAzureRepoUrl}
                                                    onChange={e => { setNewAzureRepoUrl(e.target.value); setProjectFormErrors(p => ({ ...p, azureRepoUrl: false })) }}
                                                    placeholder="https://dev.azure.com/org/project/_git/project"
                                                />
                                                {projectFormErrors.azureRepoUrl && <p className={styles.fieldError}>Required.</p>}
                                            </div>
                                        </div>
                                        {saveProjectError && <p className={styles.saveError}>{saveProjectError}</p>}
                                        <button className={styles.saveBtn} onClick={handleCreateProject} disabled={savingProject}>
                                            {savingProject ? 'Creating…' : 'Create Project'}
                                        </button>
                                    </div>
                                )}

                                {/* Projects list */}
                                {loadingProjects ? (
                                    <p className={styles.placeholderDesc}>Loading projects…</p>
                                ) : projectsError ? (
                                    <p className={styles.saveError}>{projectsError}</p>
                                ) : !user?.organization_id ? (
                                    <p className={styles.placeholderDesc}>Set up an organization first to manage projects.</p>
                                ) : projects.length === 0 ? (
                                    <p className={styles.placeholderDesc}>No projects yet. Create one above.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {projects.map(p => {
                                            const isOpen = expandedProjectId === p.id
                                            const teams = projectTeams[p.id] ?? []
                                            const isLoadingTeams = loadingTeams[p.id]
                                            const isNewTeamOpen = showNewTeamProjectId === p.id
                                            const bestPractices = projectBestPractices[p.id] ?? []
                                            const isLoadingBestPractices = loadingBestPractices[p.id]
                                            const isNewBestPracticeOpen = showNewBestPracticeProjectId === p.id
                                            const bpPage = bestPracticesPage[p.id] ?? 1
                                            const bpMeta = bestPracticesMeta[p.id] ?? { total: 0, pages: 1 }

                                            return (
                                                <div key={p.id} style={{
                                                    border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
                                                    boxShadow: isOpen ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                                    transition: 'box-shadow 0.15s',
                                                }}>
                                                    {/* Project header row */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center',
                                                        background: isOpen ? '#f5f3ff' : '#fafafa',
                                                        transition: 'background 0.1s',
                                                    }}>
                                                        <button
                                                            onClick={() => toggleProject(p.id)}
                                                            style={{
                                                                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                                                                background: 'none', border: 'none', cursor: 'pointer',
                                                                padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#111',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <svg
                                                                width="13" height="13" viewBox="0 0 24 24" fill="none"
                                                                stroke={isOpen ? '#7c3aed' : '#9ca3af'} strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round"
                                                                style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                                                            >
                                                                <polyline points="9 18 15 12 9 6" />
                                                            </svg>
                                                            <span style={{ color: isOpen ? '#5236ab' : '#111' }}>{p.name}</span>
                                                            <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>{p.azure_project}</span>
                                                        </button>
                                                        <div style={{ display: 'flex', gap: 6, paddingRight: 12 }}>
                                                            <button
                                                                onClick={() => handleDeleteProject(p.id)}
                                                                disabled={deletingProjectId === p.id}
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    color: '#ef4444', padding: '4px 6px', borderRadius: 4, opacity: deletingProjectId === p.id ? 0.5 : 1,
                                                                }}
                                                                title="Delete project"
                                                            >
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Best Practices + Teams expansion */}
                                                    {isOpen && (
                                                        <div style={{ padding: '10px 14px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                                                            {/* Best Practices */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                                    Best Practices
                                                                </p>
                                                                {role === 'admin' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowNewBestPracticeProjectId(isNewBestPracticeOpen ? null : p.id)
                                                                            setNewBestPracticeText('')
                                                                            setSaveBestPracticeError(null)
                                                                        }}
                                                                        style={{
                                                                            fontSize: 11, fontWeight: 600, color: '#5236ab',
                                                                            background: 'none', border: '1px solid #ddd8f0',
                                                                            borderRadius: 5, padding: '2px 8px', cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        {isNewBestPracticeOpen ? 'Cancel' : '+ Best Practice'}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {isNewBestPracticeOpen && (
                                                                <div style={{ marginBottom: 10 }}>
                                  <textarea
                                      className={styles.fieldInput}
                                      style={{ width: '100%', minHeight: 64, fontSize: 12, padding: '6px 10px', resize: 'vertical', fontFamily: 'inherit' }}
                                      placeholder={'Describe a best practice…\nOne per line to add several at once.'}
                                      value={newBestPracticeText}
                                      onChange={e => setNewBestPracticeText(e.target.value)}
                                      autoFocus
                                  />
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                                                        <button
                                                                            className={styles.saveBtn}
                                                                            style={{ marginTop: 0, padding: '5px 12px', fontSize: 12 }}
                                                                            onClick={() => handleCreateBestPractices(p.id)}
                                                                            disabled={savingBestPractice}
                                                                        >
                                                                            {savingBestPractice ? 'Adding…' : 'Add'}
                                                                        </button>
                                                                        {saveBestPracticeError && <p className={styles.saveError} style={{ margin: 0, fontSize: 12 }}>{saveBestPracticeError}</p>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isLoadingBestPractices ? (
                                                                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Loading best practices…</p>
                                                            ) : bestPractices.length === 0 ? (
                                                                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No best practices yet.</p>
                                                            ) : (
                                                                bestPractices.map(bp => (
                                                                    <div key={bp.id} style={{
                                                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                                                                        padding: '6px 10px', borderRadius: 6, background: '#f9fafb',
                                                                        border: '1px solid #e5e7eb', marginBottom: 4,
                                                                    }}>
                                    <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                                      {bp.description ?? String(bp.id)}
                                    </span>
                                                                        {role === 'admin' && (
                                                                            <button
                                                                                onClick={() => handleDeleteBestPractice(p.id, bp.id)}
                                                                                disabled={deletingBestPracticeId === bp.id}
                                                                                style={{
                                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                                    color: '#ef4444', padding: '2px 4px', borderRadius: 4, flexShrink: 0,
                                                                                    opacity: deletingBestPracticeId === bp.id ? 0.5 : 1,
                                                                                }}
                                                                                title="Delete best practice"
                                                                            >
                                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                                                                </svg>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}

                                                            {!isLoadingBestPractices && bpMeta.pages > 1 && (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                                    <button
                                                                        onClick={() => loadProjectBestPractices(p.id, bpPage - 1)}
                                                                        disabled={bpPage <= 1}
                                                                        style={{
                                                                            fontSize: 11, fontWeight: 600, color: bpPage <= 1 ? '#d1d5db' : '#5236ab',
                                                                            background: 'none', border: '1px solid #e5e7eb', borderRadius: 5,
                                                                            padding: '2px 8px', cursor: bpPage <= 1 ? 'default' : 'pointer',
                                                                        }}
                                                                    >
                                                                        ‹ Prev
                                                                    </button>
                                                                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Page {bpPage} of {bpMeta.pages}</span>
                                                                    <button
                                                                        onClick={() => loadProjectBestPractices(p.id, bpPage + 1)}
                                                                        disabled={bpPage >= bpMeta.pages}
                                                                        style={{
                                                                            fontSize: 11, fontWeight: 600, color: bpPage >= bpMeta.pages ? '#d1d5db' : '#5236ab',
                                                                            background: 'none', border: '1px solid #e5e7eb', borderRadius: 5,
                                                                            padding: '2px 8px', cursor: bpPage >= bpMeta.pages ? 'default' : 'pointer',
                                                                        }}
                                                                    >
                                                                        Next ›
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Teams */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
                                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                                    Teams
                                                                </p>
                                                                <button
                                                                    onClick={() => {
                                                                        setShowNewTeamProjectId(isNewTeamOpen ? null : p.id)
                                                                        setNewTeamName('')
                                                                        setSaveTeamError(null)
                                                                    }}
                                                                    style={{
                                                                        fontSize: 11, fontWeight: 600, color: '#5236ab',
                                                                        background: 'none', border: '1px solid #ddd8f0',
                                                                        borderRadius: 5, padding: '2px 8px', cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    {isNewTeamOpen ? 'Cancel' : '+ Team'}
                                                                </button>
                                                            </div>

                                                            {isNewTeamOpen && (
                                                                <div style={{ marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                                    <input
                                                                        className={styles.fieldInput}
                                                                        style={{ flex: 1, minWidth: 160, fontSize: 12, padding: '5px 10px' }}
                                                                        placeholder="Team name"
                                                                        value={newTeamName}
                                                                        onChange={e => setNewTeamName(e.target.value)}
                                                                        onKeyDown={e => e.key === 'Enter' && handleCreateTeam(p.id)}
                                                                        autoFocus
                                                                    />
                                                                    <button
                                                                        className={styles.saveBtn}
                                                                        style={{ marginTop: 0, padding: '5px 12px', fontSize: 12 }}
                                                                        onClick={() => handleCreateTeam(p.id)}
                                                                        disabled={savingTeam}
                                                                    >
                                                                        {savingTeam ? 'Creating…' : 'Create'}
                                                                    </button>
                                                                    {saveTeamError && <p className={styles.saveError} style={{ width: '100%', margin: 0, fontSize: 12 }}>{saveTeamError}</p>}
                                                                </div>
                                                            )}

                                                            {isLoadingTeams ? (
                                                                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Loading teams…</p>
                                                            ) : teams.length === 0 ? (
                                                                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No teams yet.</p>
                                                            ) : (
                                                                teams.map(t => <TeamRow key={t.id} team={t} projectId={p.id} />)
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Placeholder item={activeItem} />
                    )

                    /* ── Teams tab ─────────────────────────────────────────────────────── */
                ) : activeSection === 'teams' ? (
                    <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formCard}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <h2 className={styles.formTitle}>Teams</h2>
                                    <p className={styles.formSubtitle}>Browse teams and manage their members.</p>
                                </div>
                                {role === 'admin' && allProjects.length > 0 && (
                                    <button
                                        className={styles.saveBtn}
                                        style={{ marginTop: 0 }}
                                        onClick={() => setShowGlobalTeamForm(v => !v)}
                                    >
                                        {showGlobalTeamForm ? 'Cancel' : '+ New Team'}
                                    </button>
                                )}
                            </div>

                            {showGlobalTeamForm && (
                                <div style={{
                                    display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap',
                                    marginTop: 12, padding: 12, borderRadius: 8, background: '#f9fafb', border: '1px solid #eee',
                                }}>
                                    <select
                                        value={globalTeamProjectId ?? ''}
                                        onChange={e => setGlobalTeamProjectId(e.target.value ? Number(e.target.value) : null)}
                                        className={styles.fieldInput}
                                        style={{ fontSize: 12, padding: '6px 8px', minWidth: 160 }}
                                    >
                                        <option value="">Choose a project…</option>
                                        {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Team name"
                                        value={globalTeamName}
                                        onChange={e => setGlobalTeamName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateTeamGlobal()}
                                        className={styles.fieldInput}
                                        style={{ flex: 1, minWidth: 160, fontSize: 12, padding: '6px 10px' }}
                                    />
                                    <button
                                        className={styles.saveBtn}
                                        style={{ marginTop: 0, padding: '6px 14px', fontSize: 12 }}
                                        onClick={handleCreateTeamGlobal}
                                        disabled={savingGlobalTeam}
                                    >
                                        {savingGlobalTeam ? 'Creating…' : 'Create'}
                                    </button>
                                    {globalTeamError && (
                                        <p className={styles.saveError} style={{ width: '100%', margin: 0, fontSize: 12 }}>{globalTeamError}</p>
                                    )}
                                    <p style={{ width: '100%', margin: 0, fontSize: 11, color: '#9ca3af' }}>
                                        You&apos;ll automatically become a member of the new team — and can&apos;t be removed from it later.
                                    </p>
                                </div>
                            )}

                            {loadingAllTeams ? (
                                <p className={styles.placeholderDesc} style={{ marginTop: '1rem' }}>Loading teams…</p>
                            ) : !user?.organization_id ? (
                                <p className={styles.placeholderDesc} style={{ marginTop: '1rem' }}>Set up an organization first.</p>
                            ) : allProjects.length === 0 ? (
                                <p className={styles.placeholderDesc} style={{ marginTop: '1rem' }}>No projects yet — create one in the Projects tab first.</p>
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    {allProjects.map(project => {
                                        const teams = allTeams[project.id] ?? []
                                        if (teams.length === 0) return null
                                        return (
                                            <div key={project.id} style={{ marginBottom: '1.5rem' }}>
                                                <p style={{
                                                    margin: '0 0 6px',
                                                    fontSize: 11, fontWeight: 700, color: '#9ca3af',
                                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                                }}>
                                                    {project.name}
                                                </p>
                                                {teams.map(team => (
                                                    <React.Fragment key={team.id}>
                                                        {TeamCard({ team, projectName: project.name })}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )
                                    })}
                                    {allProjects.every(p => (allTeams[p.id] ?? []).length === 0) && (
                                        <p className={styles.placeholderDesc}>
                                            {role === 'admin' ? 'No teams yet. Use "+ New Team" above to create one.' : 'No teams yet.'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    /* ── PAT tab ───────────────────────────────────────────────────────── */
                ) : activeSection === 'pat' ? (
                    <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formCard}>
                            <h2 className={styles.formTitle}>Personal Access Token</h2>
                            <p className={styles.formSubtitle}>
                                View your stored Azure DevOps PAT. Your password is required to reveal it.
                            </p>

                            {revealedPat ? (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <label className={styles.fieldLabel}>Your PAT</label>
                                    <div className={styles.patInputWrap} style={{ marginTop: '0.375rem' }}>
                                        <input
                                            className={styles.fieldInput}
                                            type="text"
                                            readOnly
                                            value={revealedPat}
                                            style={{ fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}
                                        />
                                        <button className={styles.patToggle} type="button" onClick={handleCopyPat}>
                                            {patCopied ? (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        className={styles.modalCancel}
                                        style={{ marginTop: '1rem' }}
                                        onClick={() => { if (patRevealTimer.current) clearTimeout(patRevealTimer.current); setRevealedPat(null); setShowRevealForm(false) }}
                                    >
                                        Hide
                                    </button>
                                </div>
                            ) : showRevealForm ? (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Account password</label>
                                        <div className={styles.patInputWrap}>
                                            <input
                                                className={styles.fieldInput}
                                                type={showPatPassword ? 'text' : 'password'}
                                                value={patPassword}
                                                onChange={e => { setPatPassword(e.target.value); setPatRevealError(null) }}
                                                placeholder="••••••••"
                                                onKeyDown={e => e.key === 'Enter' && handleRevealPat()}
                                                autoFocus
                                            />
                                            <button className={styles.patToggle} type="button" onClick={() => setShowPatPassword(v => !v)} tabIndex={-1}>
                                                {showPatPassword ? (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {patRevealError && <p className={styles.saveError} style={{ marginTop: '0.5rem' }}>{patRevealError}</p>}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                        <button className={styles.saveBtn} onClick={handleRevealPat} disabled={revealingPat}>
                                            {revealingPat ? 'Verifying…' : 'Confirm'}
                                        </button>
                                        <button className={styles.modalCancel} onClick={() => { setShowRevealForm(false); setPatPassword(''); setPatRevealError(null) }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className={styles.saveBtn}
                                    style={{ marginTop: '1.25rem' }}
                                    onClick={() => setShowRevealForm(true)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Reveal PAT
                                </button>
                            )}
                        </div>
                    </div>

                    /* ── User Experience tab ───────────────────────────────────────────── */
                ) : activeSection === 'ux' ? (
                    <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formCard}>
                            <h2 className={styles.formTitle}>User Experience</h2>
                            <p className={styles.formSubtitle}>Customize platform interface preferences.</p>

                            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111' }}>Achievements UI</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                                            Hide the Achievements nav link and user tag badge across the platform.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setHideAchievements(!hideAchievements)}
                                        style={{
                                            flexShrink: 0, marginLeft: '1rem',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            fontSize: 12, fontWeight: 600,
                                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                                            border: '1px solid #e5e7eb',
                                            background: hideAchievements ? '#fef2f2' : '#f0fdf4',
                                            color: hideAchievements ? '#dc2626' : '#15803d',
                                        }}
                                    >
                                        {hideAchievements ? '👁 Show' : '🙈 Hide'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    <Placeholder item={activeItem} />
                )}
            </div>

            {/* Delete confirm modal */}
            {showConfirm && (
                <div className={styles.modalOverlay} onClick={() => { setShowConfirm(false); setDeleteError(null) }}>
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <p className={styles.modalTitle}>Leave organization?</p>
                        <p className={styles.modalDesc}>
                            Your account will be disassociated from <strong>{currentOrg?.name}</strong>. The organization itself will not be deleted.
                        </p>
                        {deleteError && <p className={styles.modalError}>{deleteError}</p>}
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => { setShowConfirm(false); setDeleteError(null) }} disabled={deleting}>Cancel</button>
                            <button className={styles.modalDelete} onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}