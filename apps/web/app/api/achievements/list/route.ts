import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BACKEND_URL = 'https://tfc-userstories.onrender.com/achievements'

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(BACKEND_URL)
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json(await res.json())
}
