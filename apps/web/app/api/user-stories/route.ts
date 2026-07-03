import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

// Proxies to the real backend history endpoint (GET /me/submissions), which is
// team-visibility-aware (see Settings > Teams > History visibility).
// Optional ?team_id= lets the dashboard filter by a specific team the user belongs to.
export async function GET(request: Request) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = request.headers.get('Authorization') ?? ''
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    const page = searchParams.get('page') ?? '1'
    const limit = searchParams.get('limit') ?? '300'

    const qs = new URLSearchParams({ page, limit })
    if (teamId) qs.set('team_id', teamId)

    const res = await fetch(`${BASE}/me/submissions?${qs.toString()}`, {
        headers: { Authorization: auth },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    return NextResponse.json(await res.json())
}