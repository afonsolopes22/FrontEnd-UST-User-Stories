/**
 * User Story — evaluate flow unit tests
 *
 * Covers the POST to the external evaluate endpoint triggered when the
 * page loads with ?evaluate=1, including the Authorization header fix.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── Mocks ────────────────────────────────────────────────────────────────────

let mockSearchParams: Record<string, string> = {}

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}))

const mockAddHistoryItem = jest.fn().mockResolvedValue(undefined)
jest.mock('@/app/_context/HistoryContext', () => ({
  useHistory: () => ({
    historyItems: [],
    loading: false,
    addHistoryItem: mockAddHistoryItem,
  }),
}))

jest.mock('@/app/_context/AuthContext', () => ({
  useAuth: () => ({ token: 'bearer-xyz' }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ORG = { id: 5, name: 'TestOrg', azure_org: 'test-org' }

const EVAL_RESULT = {
  score: 78,
  code_quality: 65,
  user_story_title: 'Login feature',
  summary: 'Mostly good implementation.',
  passed: ['Criterion A', 'Criterion B'],
  failed: ['Criterion C'],
  improvements: ['Improve error handling'],
  best_practices_feedback: ['Add unit tests'],
  github_url: 'https://github.com/org/repo',
  pr_url: null,
  azure_work_item_id: 42,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupEvaluateParams() {
  mockSearchParams = {
    work_item_id: '42',
    evaluate: '1',
    project_id: '10',
    branch: 'main',
  }
  localStorage.setItem('current_org', JSON.stringify(ORG))
}

async function importPage() {
  // Dynamic import so mocks are in place before module loads
  const mod = await import('@/app/(protected)/user-story/page')
  return mod.default
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('User Story — evaluate flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockSearchParams = {}
  })

  // ── Loading state ─────────────────────────────────────────────────────────

  it('shows "Evaluating…" while the request is in flight', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn(() => new Promise(() => {})) // never resolves

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(screen.getByText(/evaluating/i)).toBeInTheDocument()
    )
  })

  // ── Correct POST payload ──────────────────────────────────────────────────

  it('POSTs with work_item_id, organization_id, project_id and branch', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(init.body)

    expect(body.work_item_id).toBe(42)
    expect(body.organization_id).toBe(ORG.id)
    expect(body.project_id).toBe(10)
    expect(body.branch).toBe('main')
  })

  it('sends the Authorization header in the evaluate POST', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers['Authorization']).toBe('Bearer bearer-xyz')
  })

  // ── Success path ──────────────────────────────────────────────────────────

  it('renders the score after a successful evaluation', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => expect(screen.getByText('78%')).toBeInTheDocument())
    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('renders the user story title', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(screen.getByText('Login feature')).toBeInTheDocument()
    )
  })

  it('renders passed and failed criteria', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Criterion A')).toBeInTheDocument()
      expect(screen.getByText('Criterion C')).toBeInTheDocument()
    })
  })

  it('renders improvements and best practices sections', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Improve error handling')).toBeInTheDocument()
      expect(screen.getByText('Add unit tests')).toBeInTheDocument()
    })
  })

  it('calls addHistoryItem with the evaluation result', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(EVAL_RESULT),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() => expect(mockAddHistoryItem).toHaveBeenCalledTimes(1))

    const arg = mockAddHistoryItem.mock.calls[0][0]
    expect(arg.azure_work_item_id).toBe('42')
    expect(arg.score).toBe(78)
    expect(arg.code_quality).toBe(65)
    expect(arg.passed).toEqual(['Criterion A', 'Criterion B'])
    expect(arg.failed).toEqual(['Criterion C'])
  })

  // ── Error path ────────────────────────────────────────────────────────────

  it('shows the backend error detail on a non-ok response', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Not authenticated' }),
    })

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    )
  })

  it('shows a generic error message when fetch throws', async () => {
    setupEvaluateParams()
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(screen.getByText('Network error')).toBeInTheDocument()
    )
  })

  it('shows the error fallback for missing org in localStorage', async () => {
    mockSearchParams = { work_item_id: '1', evaluate: '1', project_id: '10', branch: 'main' }
    localStorage.clear() // no current_org

    global.fetch = jest.fn()

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(
        screen.getByText(/no organization configured/i)
      ).toBeInTheDocument()
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // ── Static view (no evaluate flag) ───────────────────────────────────────

  it('shows "Work item not found." when no history matches', async () => {
    mockSearchParams = { work_item_id: '999' } // no evaluate=1

    const Page = await importPage()
    render(<Page />)

    await waitFor(() =>
      expect(screen.getByText('Work item not found.')).toBeInTheDocument()
    )
  })
})
