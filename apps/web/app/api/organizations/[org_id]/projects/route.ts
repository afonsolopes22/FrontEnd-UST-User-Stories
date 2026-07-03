import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request, { params }: { params: Promise<{ org_id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const res = await fetch(`${BASE}/organizations/${org_id}/projects`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json(await res.json())
}

export async function POST(request: Request, { params }: { params: Promise<{ org_id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const body = await request.json()

  const res = await fetch(`${BASE}/organizations/${org_id}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      name: body.name,
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
