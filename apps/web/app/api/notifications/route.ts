import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = request.headers.get('Authorization') ?? ''
  const res = await fetch(`${BASE}/notifications`, { headers: { Authorization: auth } })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data : (data.items ?? []))
}
