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

// Admin-only on the backend (require_admin) — creates a new achievement with a
// structured, auto-detectable criteria (metric/comparator/value/count).
export async function POST(request: Request) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = request.headers.get('Authorization') ?? ''
    const body = await request.json()

    const payload: Record<string, unknown> = {
        name: body.name,
        description: body.description,
        metric_1: body.metric_1,
        comparator_1: body.comparator_1,
        value_1: body.value_1,
        count_required: body.count_required ?? 1,
        color: body.color ?? '#9ca3af',
        text_color: body.text_color ?? '#ffffff',
    }
    if (body.metric_2 && body.comparator_2 && body.value_2 !== undefined) {
        payload.metric_2 = body.metric_2
        payload.comparator_2 = body.comparator_2
        payload.value_2 = body.value_2
    }

    const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
}