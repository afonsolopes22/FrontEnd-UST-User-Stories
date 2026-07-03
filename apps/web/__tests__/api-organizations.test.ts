/**
 * @jest-environment node
 *
 * Unit tests for the /api/organizations Next.js route handler.
 * Key regression: POST was not forwarding the Authorization header to the backend.
 */

import { GET, POST, DELETE } from '@/app/api/organizations/route'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUserId = jest.fn<string | null, [Request]>()

jest.mock('@/lib/getAuthUser', () => ({
  getUserIdFromRequest: (...args: [Request]) => mockGetUserId(...args),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOKEN = 'Bearer test-token'

function makeRequest(
  method: string,
  url: string,
  { body, token = TOKEN }: { body?: unknown; token?: string | null } = {}
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = token
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const ORG_PAYLOAD = { name: 'Acme', azure_org: 'acme-org', azure_pat: 'secret-pat' }
const ORG_RESPONSE = { id: 1, name: 'Acme', azure_org: 'acme-org' }

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserId.mockReturnValue('42') // authenticated by default
})

// ─── POST /api/organizations ─────────────────────────────────────────────────

describe('POST /api/organizations', () => {
  it('returns 401 when no authenticated user', async () => {
    mockGetUserId.mockReturnValue(null)
    global.fetch = jest.fn()

    const req = makeRequest('POST', 'http://localhost/api/organizations', { body: ORG_PAYLOAD, token: null })
    const res = await POST(req)

    expect(res.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards the Authorization header to the backend', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(ORG_RESPONSE),
    })

    const req = makeRequest('POST', 'http://localhost/api/organizations', { body: ORG_PAYLOAD })
    await POST(req)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/organizations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: TOKEN }),
      })
    )
  })

  it('sends name, azure_org and azure_pat to the backend', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(ORG_RESPONSE),
    })

    const req = makeRequest('POST', 'http://localhost/api/organizations', { body: ORG_PAYLOAD })
    await POST(req)

    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(sentBody).toEqual({ name: 'Acme', azure_org: 'acme-org', azure_pat: 'secret-pat' })
  })

  it('returns the org id, name and azure_org on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(ORG_RESPONSE),
    })

    const req = makeRequest('POST', 'http://localhost/api/organizations', { body: ORG_PAYLOAD })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.name).toBe('Acme')
    expect(data.azure_org).toBe('acme-org')
  })

  it('propagates the backend error status and message on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ detail: 'Not authenticated' }),
    })

    const req = makeRequest('POST', 'http://localhost/api/organizations', { body: ORG_PAYLOAD })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe('Not authenticated')
  })
})

// ─── GET /api/organizations ───────────────────────────────────────────────────

describe('GET /api/organizations', () => {
  it('returns an empty array when the backend returns non-array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    })

    const req = makeRequest('GET', 'http://localhost/api/organizations')
    const res = await GET(req)
    const data = await res.json()

    expect(Array.isArray(data)).toBe(true)
  })

  it('unwraps paginated envelope (items array)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [ORG_RESPONSE], total: 1 }),
    })

    const req = makeRequest('GET', 'http://localhost/api/organizations')
    const res = await GET(req)
    const data = await res.json()

    expect(data).toEqual([ORG_RESPONSE])
  })

  it('forwards the Authorization header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const req = makeRequest('GET', 'http://localhost/api/organizations')
    await GET(req)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: TOKEN }) })
    )
  })
})

// ─── DELETE /api/organizations ────────────────────────────────────────────────

describe('DELETE /api/organizations', () => {
  it('returns 400 when org_id is missing', async () => {
    const req = makeRequest('DELETE', 'http://localhost/api/organizations')
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('forwards the Authorization header to the backend', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const req = makeRequest('DELETE', 'http://localhost/api/organizations?org_id=1')
    await DELETE(req)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: TOKEN }),
      })
    )
  })

  it('returns { success: true } on successful delete', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const req = makeRequest('DELETE', 'http://localhost/api/organizations?org_id=1')
    const res = await DELETE(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
