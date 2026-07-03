import { NextResponse } from 'next/server'

const BACKEND_URL = 'https://tfc-userstories.onrender.com/auth/me/organization'

function mapUser(data: Record<string, unknown>) {
  return {
    user_id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    organization_id: data.organization_id ?? null,
  }
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return NextResponse.json(null, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('organization_id')
  if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  const res = await fetch(`${BACKEND_URL}?organization_id=${orgId}`, {
    method: 'PATCH',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json(mapUser(await res.json()))
}
