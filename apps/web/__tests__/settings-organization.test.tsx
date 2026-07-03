/**
 * Settings page — Organization tab
 *
 * Tests the core contract: when /auth/me returns organization_id, the org card
 * must be displayed (not the "Add Organization" form).  Covers the cases that
 * were broken: fresh login with org already set, and logout → re-login.
 */

import { render, screen, waitFor } from '@testing-library/react'
import SettingsPage from '@/app/(protected)/settings/page'
import { useAuth } from '@/app/_context/AuthContext'

// ─── Static mocks ────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/app/_context/AchievementsContext', () => ({
  useAchievements: () => ({ hideAchievements: false, setHideAchievements: jest.fn() }),
}))

jest.mock('@/app/_context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/_context/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [], unreadCount: 0, pendingToasts: [],
    dismissToast: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn(), refresh: jest.fn(),
  }),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TOKEN = 'test-bearer-token'

const BASE_USER = {
  user_id: 8,
  name: 'Laercio',
  email: 'laercio@cgi.com',
  role: 'admin' as const,
}

/** Real org data from the backend */
const ORG = {
  id: 1,
  name: '_tests',
  azure_org: 'ustQuality',
  azure_project: null,
  azure_repo_url: null,
}

function makeAuth(organization_id: number | null) {
  return {
    status: 'authenticated' as const,
    token: TOKEN,
    user: { ...BASE_USER, organization_id },
    updateUser: jest.fn(),
    refreshUser: jest.fn().mockResolvedValue(undefined),
  }
}

// ─── fetch helpers ───────────────────────────────────────────────────────────

function mockFetchWithOrg() {
  global.fetch = jest.fn((url: string) => {
    // org detail
    if (typeof url === 'string' && url.includes('org_id=1')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(ORG) })
    }
    // org list (used by handleSave)
    if (typeof url === 'string' && url.includes('/api/organizations') && !url.includes('org_id')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([ORG]) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  }) as jest.Mock
}

function mockFetchNoOrg() {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ) as jest.Mock
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Settings — Organization sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 1. User already has an org on load ──────────────────────────────────

  it('shows the org card (not the add-form) when user has organization_id on mount', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()

    render(<SettingsPage />)

    // ustQuality appears in both the top bar and the org info card — use getAllByText
    await waitFor(() => expect(screen.getAllByText('ustQuality').length).toBeGreaterThan(0))
    expect(screen.getAllByText('_tests').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /add organization/i })).not.toBeInTheDocument()
  })

  it('shows "Change Organization" heading (not "Add Organization") when org is loaded', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()

    render(<SettingsPage />)

    await waitFor(() => expect(screen.getByText('Change Organization')).toBeInTheDocument())
    expect(screen.queryByText('Add Organization')).not.toBeInTheDocument()
  })

  it('shows "Active Organization" badge inside the info card', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()

    render(<SettingsPage />)

    await waitFor(() => expect(screen.getByText('Active Organization')).toBeInTheDocument())
  })

  // ── 2. User has no org ──────────────────────────────────────────────────

  it('shows "Add Organization" form when user has no organization_id', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(null))
    mockFetchNoOrg()

    render(<SettingsPage />)

    // loadingOrg becomes false immediately when no org_id
    await waitFor(() => expect(screen.getByText('Add Organization')).toBeInTheDocument())
    expect(screen.queryByText('ustQuality')).not.toBeInTheDocument()
  })

  // ── 3. org_id arrives after initial render (login enrichment via /auth/me) ─

  it('switches from "Add Organization" to the org card when organization_id is set after render', async () => {
    // First render: no org_id yet (login response before /auth/me enrichment)
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(null))
    mockFetchNoOrg()

    const { rerender } = render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('Add Organization')).toBeInTheDocument())

    // /auth/me enriches user with organization_id — simulate context update
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()
    rerender(<SettingsPage />)

    await waitFor(() => expect(screen.getAllByText('ustQuality').length).toBeGreaterThan(0))
    expect(screen.queryByText('Add Organization')).not.toBeInTheDocument()
  })

  // ── 4. Logout → re-login ────────────────────────────────────────────────

  it('shows the org card after logout followed by re-login', async () => {
    // Logged-out state
    ;(useAuth as jest.Mock).mockReturnValue({
      status: 'unauthenticated' as const,
      token: null,
      user: null,
      updateUser: jest.fn(),
      refreshUser: jest.fn().mockResolvedValue(undefined),
    })
    mockFetchNoOrg()

    const { rerender } = render(<SettingsPage />)

    // Re-login: user has organization_id = 1 (from /auth/me after login)
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()
    rerender(<SettingsPage />)

    await waitFor(() => expect(screen.getAllByText('ustQuality').length).toBeGreaterThan(0))
    expect(screen.getAllByText('_tests').length).toBeGreaterThan(0)
    expect(screen.getByText('Change Organization')).toBeInTheDocument()
  })

  // ── 5. Correct API call ─────────────────────────────────────────────────

  it('calls GET /api/organizations (list) with the Bearer token to load the org', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()

    render(<SettingsPage />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/organizations'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    ))
  })

  // ── 6. Graceful degradation ─────────────────────────────────────────────

  it('shows "Add Organization" when the org list is empty (org not found in backend)', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    // List returns empty — the user's org_id (1) won't be found
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as jest.Mock

    render(<SettingsPage />)

    await waitFor(() => expect(screen.getByText('Add Organization')).toBeInTheDocument())
  })

  // ── 7. Save form — associate existing org ───────────────────────────────

  it('does not show the save form fields after org is loaded', async () => {
    ;(useAuth as jest.Mock).mockReturnValue(makeAuth(1))
    mockFetchWithOrg()

    render(<SettingsPage />)

    await waitFor(() => expect(screen.getByText('Change Organization')).toBeInTheDocument())
    // PAT field should still be visible (for changing org), but azure_project removed
    expect(screen.queryByLabelText(/azure project/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/azure repo url/i)).not.toBeInTheDocument()
  })
})
