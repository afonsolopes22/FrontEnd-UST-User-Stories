import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''

  const res = await fetch(`${BASE}/teams/${id}/members`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  const data = await res.json()
  // Backend returns paginated shape { members: [...] }; normalize to flat array with user_id
  const rawMembers: { id?: number; user_id?: number; name?: string; email: string; role?: string }[] =
    Array.isArray(data) ? data : (data.members ?? [])
  const members = rawMembers.map(m => ({ ...m, user_id: m.user_id ?? m.id }))
  return NextResponse.json(members)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const body = await request.json()

  const res = await fetch(`${BASE}/teams/${id}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ email: body.email }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  const member = await res.json()
  // Normalize id → user_id for frontend compatibility
  return NextResponse.json({ ...member, user_id: member.user_id ?? member.id })
}
