'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/_context/AuthContext'
import styles from '@/app/(protected)/analyze/analyze.module.css'

type Org = { id: number; name: string; azure_org: string; azure_project?: string }
type Project = { id: number; name: string; azure_project: string }
type WorkItemOption = { id: number; title: string; type: string; state: string }

const SUGGESTIONS_INITIAL_LIMIT = 100
const SUGGESTIONS_FILTERED_LIMIT = 20

export default function Page() {
    const { token } = useAuth()
    const router = useRouter()

    const [org, setOrg] = useState<Org | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [branches, setBranches] = useState<string[]>([])
    const [loadingBranches, setLoadingBranches] = useState(false)
    const [branch, setBranch] = useState('main')
    const [workItemId, setWorkItemId] = useState('')
    const [errors, setErrors] = useState({ workItemId: false, project: false })
    const [workItemOptions, setWorkItemOptions] = useState<WorkItemOption[]>([])
    const [loadingWorkItems, setLoadingWorkItems] = useState(false)
    const [workItemsTruncated, setWorkItemsTruncated] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Read org from localStorage — no API call needed
    useEffect(() => {
        try {
            const stored = localStorage.getItem('current_org')
            if (stored) setOrg(JSON.parse(stored))
        } catch {}
    }, [])

    // Load projects whenever org and token are ready
    useEffect(() => {
        if (!org?.id || !token) return
        setLoadingProjects(true)
        fetch(`/api/organizations/${org.id}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) return
                setProjects(data)
                if (data.length === 1) setSelectedProjectId(String(data[0].id))
            })
            .finally(() => setLoadingProjects(false))
    }, [org?.id, token])

    // Load branches whenever org, project and token are ready
    useEffect(() => {
        if (!org?.id || !selectedProjectId || !token) {
            setBranches([])
            return
        }
        setLoadingBranches(true)
        fetch(`/api/organizations/${org.id}/projects/${selectedProjectId}/branches`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data?.branches) ? data.branches : []
                setBranches(list)
                setBranch(list.includes('main') ? 'main' : (list[0] ?? ''))
            })
            .finally(() => setLoadingBranches(false))
    }, [org?.id, selectedProjectId, token])

    // Load recent work items for the searchable dropdown whenever project changes
    useEffect(() => {
        if (!org?.id || !selectedProjectId || !token) {
            setWorkItemOptions([])
            setWorkItemsTruncated(false)
            return
        }
        setLoadingWorkItems(true)
        fetch(`/api/organizations/${org.id}/projects/${selectedProjectId}/work-items?limit=${SUGGESTIONS_INITIAL_LIMIT}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => (r.ok ? r.json() : []))
            .then((data: WorkItemOption[]) => {
                const list = Array.isArray(data) ? data : []
                setWorkItemOptions(list)
                setWorkItemsTruncated(list.length >= SUGGESTIONS_INITIAL_LIMIT)
            })
            .catch(() => { setWorkItemOptions([]); setWorkItemsTruncated(false) })
            .finally(() => setLoadingWorkItems(false))
    }, [org?.id, selectedProjectId, token])

    // What the dropdown actually shows: first 100 when empty, or the first 20 whose ID
    // contains the digits typed so far.
    const visibleSuggestions = (() => {
        const query = workItemId.trim()
        if (!query) return workItemOptions.slice(0, SUGGESTIONS_INITIAL_LIMIT)
        return workItemOptions
            .filter(item => String(item.id).includes(query))
            .slice(0, SUGGESTIONS_FILTERED_LIMIT)
    })()

    function handleSubmit() {
        const errs = { workItemId: !workItemId.trim(), project: !selectedProjectId }
        setErrors(errs)
        if (errs.workItemId || errs.project) return
        router.push(
            `/user-story?work_item_id=${workItemId.trim()}&evaluate=1` +
            `&project_id=${selectedProjectId}` +
            `&branch=${encodeURIComponent(branch.trim() || 'main')}`
        )
    }

    const canSubmit = !!org && !!selectedProjectId && !loadingProjects

    return (
        <div className={styles.container}>

            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.iconWrap}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <circle cx="10" cy="13" r="2" />
                        <path d="M12 15l2 2" />
                    </svg>
                </div>
                <h1 className={styles.title}>Analyze User Story Quality</h1>
                <p className={styles.subtitle}>
                    Validate the implementation quality of a user story using a Work Item ID.
                </p>
            </div>

            {/* Org pills */}
            {org ? (
                <div className={styles.orgRow}>
                    <div className={styles.orgPill}>
                        <span className={styles.orgDot} />
                        <span className={styles.orgPillLabel}>Org:</span>
                        <span className={styles.orgPillValue}>{org.azure_org}</span>
                    </div>
                    {org.name && (
                        <div className={styles.orgPill}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <span className={styles.orgPillLabel}>Name:</span>
                            <span className={styles.orgPillValue}>{org.name}</span>
                        </div>
                    )}
                </div>
            ) : (
                <a href="/settings" className={styles.noOrgBanner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                        <p className={styles.noOrgTitle}>No organization configured</p>
                        <p className={styles.noOrgDesc}>Click here to connect your Azure DevOps org in Settings →</p>
                    </div>
                </a>
            )}

            {/* Form card */}
            <div className={styles.card}>

                {/* Project selector */}
                <label className={styles.fieldLabel}>Project</label>
                <div className={`${styles.inputWrap} ${errors.project ? styles.inputWrapError : ''}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 12, flexShrink: 0 }}>
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <select
                        className={styles.input}
                        value={selectedProjectId}
                        onChange={e => { setSelectedProjectId(e.target.value); setErrors(p => ({ ...p, project: false })) }}
                        disabled={!org || loadingProjects}
                        style={{ cursor: org && !loadingProjects ? 'pointer' : 'default', paddingLeft: 8 }}
                    >
                        <option value="">
                            {!org ? 'Configure an organization first' : loadingProjects ? 'Loading projects…' : projects.length === 0 ? 'No projects available' : 'Select a project…'}
                        </option>
                        {projects.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.name}</option>
                        ))}
                    </select>
                </div>
                {errors.project && <p className={styles.fieldError}>Please select a project.</p>}

                {/* Branch */}
                <label className={styles.fieldLabel} style={{ marginTop: '1.25rem' }}>Branch</label>
                <div className={styles.inputWrap}>
                    <span className={styles.inputPrefix} style={{ fontSize: 13, letterSpacing: '-0.02em' }}>⎇</span>
                    <select
                        className={styles.input}
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        disabled={!selectedProjectId || loadingBranches}
                        style={{ cursor: selectedProjectId && !loadingBranches ? 'pointer' : 'default', paddingLeft: 8 }}
                    >
                        <option value="">
                            {!selectedProjectId ? 'Select a project first' : loadingBranches ? 'Loading branches…' : branches.length === 0 ? 'No branches available' : 'Select a branch…'}
                        </option>
                        {branches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {/* Work Item ID */}
                <label className={styles.fieldLabel} style={{ marginTop: '1.25rem' }}>Work Item ID</label>
                <div style={{ position: 'relative' }}>
                    <div className={`${styles.inputWrap} ${errors.workItemId ? styles.inputWrapError : ''}`}>
                        <span className={styles.inputPrefix}>#</span>
                        <input
                            className={styles.input}
                            type="text"
                            inputMode="numeric"
                            value={workItemId}
                            onChange={e => {
                                setWorkItemId(e.target.value)
                                setErrors(p => ({ ...p, workItemId: false }))
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); handleSubmit() } }}
                            placeholder="Enter Work Item ID (e.g. 1234) or search…"
                            autoComplete="off"
                            autoFocus
                        />
                        {loadingWorkItems && (
                            <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 12, whiteSpace: 'nowrap' }}>Loading…</span>
                        )}
                    </div>
                    {errors.workItemId && <p className={styles.fieldError}>Work Item ID is required.</p>}

                    {showSuggestions && selectedProjectId && visibleSuggestions.length > 0 && (
                        <div
                            style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 280, overflowY: 'auto', zIndex: 20,
                            }}
                        >
                            {!workItemId.trim() && workItemsTruncated && (
                                <p style={{ margin: 0, padding: '6px 12px', fontSize: 11, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                                    Showing the first {SUGGESTIONS_INITIAL_LIMIT} most recently changed items — type digits to search.
                                </p>
                            )}
                            {workItemId.trim() && visibleSuggestions.length === SUGGESTIONS_FILTERED_LIMIT && (
                                <p style={{ margin: 0, padding: '6px 12px', fontSize: 11, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                                    Showing the first {SUGGESTIONS_FILTERED_LIMIT} matches.
                                </p>
                            )}
                            {visibleSuggestions.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                        setWorkItemId(String(item.id))
                                        setErrors(p => ({ ...p, workItemId: false }))
                                        setShowSuggestions(false)
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                        padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6',
                                        cursor: 'pointer', textAlign: 'left', font: 'inherit',
                                    }}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5236ab', flexShrink: 0 }}>#{item.id}</span>
                                    <span style={{ fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || '(no title)'}
                  </span>
                                    {item.state && (
                                        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>{item.state}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    {showSuggestions && selectedProjectId && !loadingWorkItems && workItemId.trim() && visibleSuggestions.length === 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 12px', zIndex: 20,
                        }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                                No recent work item matches &quot;{workItemId.trim()}&quot; — you can still submit this ID directly.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    className={styles.submitBtn}
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Validate User Story
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>

            {/* Security note */}
            <p className={styles.securityNote}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Your data is secure and only used for quality analysis.
            </p>
        </div>
    )
}