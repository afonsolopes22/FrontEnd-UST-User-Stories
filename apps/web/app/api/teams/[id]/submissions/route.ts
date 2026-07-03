import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const auth = request.headers.get('Authorization') ?? ''
    const { searchParams } = new URL(request.url)
    const qs = new URLSearchParams()
    const userIdFilter = searchParams.get('user_id')
    const workItemId = searchParams.get('work_item_id')
    const limit = searchParams.get('limit') ?? '10'
    const page = searchParams.get('page') ?? '1'
    if (userIdFilter) qs.set('user_id', userIdFilter)
    if (workItemId) qs.set('work_item_id', workItemId)
    qs.set('limit', limit)
    qs.set('page', page)

    const res = await fetch(`${BASE}/teams/${id}/submissions?${qs.toString()}`, {
        headers: { Authorization: auth },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : [])
}