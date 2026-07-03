/**
 * @jest-environment node
 *
 * Integration test — calls the real evaluate/azure endpoint.
 * Run with: npx jest evaluate-azure.integration --verbose
 */

const ENDPOINT = 'https://tfc-userstories.onrender.com/evaluate/azure'

const PAYLOAD = {
  work_item_id: '1',
  language: 'auto',
  github_url: 'https://github.com/LaercioSant0s/gerador_legendas',
  azure_repo_url: '',
  organization_id: '1',
}

describe('POST /evaluate/azure', () => {
  let response: Response
  let body: Record<string, unknown>

  beforeAll(async () => {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PAYLOAD),
    })
    body = await response.json()
    console.log('\n--- Response body ---')
    console.log(JSON.stringify(body, null, 2))
  }, 60_000) // 60s timeout — endpoint may be cold

  it('returns HTTP 200', () => {
    expect(response.status).toBe(200)
  })

  it('has score as a number between 0 and 100', () => {
    expect(typeof body.score).toBe('number')
    expect(body.score).toBeGreaterThanOrEqual(0)
    expect(body.score).toBeLessThanOrEqual(100)
  })

  it('has code_quality as a number between 0 and 100', () => {
    expect(typeof body.code_quality).toBe('number')
    expect(body.code_quality).toBeGreaterThanOrEqual(0)
    expect(body.code_quality).toBeLessThanOrEqual(100)
  })

  it('has summary as a non-empty string', () => {
    expect(typeof body.summary).toBe('string')
    expect((body.summary as string).length).toBeGreaterThan(0)
  })

  it('has passed as an array', () => {
    expect(Array.isArray(body.passed)).toBe(true)
  })

  it('has failed as an array', () => {
    expect(Array.isArray(body.failed)).toBe(true)
  })

  it('has improvements as an array', () => {
    expect(Array.isArray(body.improvements)).toBe(true)
  })

  it('has azure_work_item_id as a number', () => {
    expect(typeof body.azure_work_item_id).toBe('number')
  })

  it('has github_url as a string', () => {
    expect(typeof body.github_url).toBe('string')
  })

  it('does NOT have met_criteria or failed_criteria (old field names)', () => {
    expect(body.met_criteria).toBeUndefined()
    expect(body.failed_criteria).toBeUndefined()
  })
})
