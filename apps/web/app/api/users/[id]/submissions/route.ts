import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

// Backend enforces that only the member themselves, an admin, or a scrum master can view this.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ?? '10'
  const page = searchParams.get('page') ?? '1'

  const res = await fetch(`${BASE}/members/${id}/submissions?page=${page}&limit=${limit}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data : [])
}
