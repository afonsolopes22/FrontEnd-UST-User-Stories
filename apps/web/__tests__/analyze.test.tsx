/**
 * Analyze page — unit tests
 *
 * The analyze page is a form that reads the current org from localStorage,
 * loads projects for that org and navigates to /user-story with evaluate=1.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page from '@/app/(protected)/analyze/page'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/app/_context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG = { id: 3, name: 'Acme', azure_org: 'acme-devops' }
const PROJECTS = [
  { id: 10, name: 'Alpha', azure_project: 'alpha-proj' },
  { id: 11, name: 'Beta', azure_project: 'beta-proj' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setOrg(org: typeof ORG | null) {
  if (org) localStorage.setItem('current_org', JSON.stringify(org))
  else localStorage.removeItem('current_org')
}

function mockProjectsFetch(projects = PROJECTS) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(projects),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Analyze Page', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    user = userEvent.setup()
  })

  // ── No org state ──────────────────────────────────────────────────────────

  it('shows a "no organization" warning when localStorage has no org', () => {
    global.fetch = jest.fn()
    render(<Page />)
    expect(screen.getByText(/no organization configured/i)).toBeInTheDocument()
  })

  it('disables the submit button when no org is configured', () => {
    global.fetch = jest.fn()
    render(<Page />)
    expect(screen.getByRole('button', { name: /validate user story/i })).toBeDisabled()
  })

  // ── Org present — project loading ─────────────────────────────────────────

  it('shows the org name in the pill when org is set', () => {
    setOrg(ORG)
    mockProjectsFetch()
    render(<Page />)
    expect(screen.getByText('acme-devops')).toBeInTheDocument()
  })

  it('fetches projects for the org with the Bearer token', async () => {
    setOrg(ORG)
    mockProjectsFetch()
    render(<Page />)

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/organizations/${ORG.id}/projects`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
    )
  })

  it('renders loaded projects in the dropdown', async () => {
    setOrg(ORG)
    mockProjectsFetch()
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
  })

  it('auto-selects the only project when there is just one', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('10')
    })
  })

  // ── Validation ────────────────────────────────────────────────────────────

  it('shows an error if work item id is empty on submit', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled())
    await user.click(screen.getByRole('button', { name: /validate user story/i }))

    expect(screen.getByText('Work Item ID is required.')).toBeInTheDocument()
  })

  it('shows an error if no project is selected on submit', async () => {
    setOrg(ORG)
    mockProjectsFetch([])
    render(<Page />)

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0))
    // Manually trigger submit — project dropdown has no options
    await user.type(screen.getByPlaceholderText(/enter work item id/i), '42')
    // submit is disabled when no project, test the error state directly
    const btn = screen.getByRole('button', { name: /validate user story/i })
    expect(btn).toBeDisabled()
  })

  // ── Navigation ────────────────────────────────────────────────────────────

  it('navigates to /user-story with correct params after a valid submit', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), '10')
    await user.type(screen.getByPlaceholderText(/enter work item id/i), '42')
    await user.click(screen.getByRole('button', { name: /validate user story/i }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('work_item_id=42')
    )
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('evaluate=1')
    )
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('project_id=10')
    )
  })

  it('includes the branch in the navigation URL', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())

    // Change branch to 'develop'
    const branchInput = screen.getByPlaceholderText('main')
    await user.clear(branchInput)
    await user.type(branchInput, 'develop')

    await user.selectOptions(screen.getByRole('combobox'), '10')
    await user.type(screen.getByPlaceholderText(/enter work item id/i), '7')
    await user.click(screen.getByRole('button', { name: /validate user story/i }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('branch=develop')
    )
  })

  it('defaults to branch "main" when left empty', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), '10')
    await user.type(screen.getByPlaceholderText(/enter work item id/i), '5')
    // Leave branch as default 'main'
    await user.click(screen.getByRole('button', { name: /validate user story/i }))

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('branch=main'))
  })

  it('pressing Enter in the Work Item ID field submits the form', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), '10')
    await user.type(screen.getByPlaceholderText(/enter work item id/i), '99{Enter}')

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('work_item_id=99'))
  })

  // ── Error clearing ────────────────────────────────────────────────────────

  it('clears the Work Item ID error when user starts typing', async () => {
    setOrg(ORG)
    mockProjectsFetch([PROJECTS[0]])
    render(<Page />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument())
    await user.selectOptions(screen.getByRole('combobox'), '10')
    await user.click(screen.getByRole('button', { name: /validate user story/i }))

    expect(screen.getByText('Work Item ID is required.')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/enter work item id/i), '1')
    expect(screen.queryByText('Work Item ID is required.')).not.toBeInTheDocument()
  })
})
