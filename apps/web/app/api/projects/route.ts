import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BACKEND_URL = 'https://tfc-userstories.onrender.com/projects'

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  if (!organizationId) return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })

  const res = await fetch(`${BACKEND_URL}?organization_id=${organizationId}`)
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json(await res.json())
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: body.name,
      organization_id: body.organization_id,
      azure_project: body.azure_project,
      azure_repo_url: body.azure_repo_url ?? '',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json(await res.json())
}
