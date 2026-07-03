import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; team_id: string }> }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, team_id } = await params
  const auth = request.headers.get('Authorization') ?? ''
  const res = await fetch(`${BASE}/projects/${id}/teams/${team_id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json({ success: true })
}
