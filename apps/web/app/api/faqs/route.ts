import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = request.headers.get('Authorization') ?? ''
    const res = await fetch(`${BASE}/faqs?page=1&limit=30`, { headers: { Authorization: auth } })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : (data.items ?? []))
}

// Admin-only on the backend (require_admin) — creates a new FAQ entry.
export async function POST(request: Request) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = request.headers.get('Authorization') ?? ''
    const body = await request.json()

    const res = await fetch(`${BASE}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({
            question: body.question,
            answer: body.answer,
            category: body.category ?? null,
        }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
}