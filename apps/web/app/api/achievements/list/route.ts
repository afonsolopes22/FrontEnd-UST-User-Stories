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

// Admin-only on the backend (require_admin) — creates a new achievement.
export async function POST(request: Request) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const auth = request.headers.get('Authorization') ?? ''
    const body = await request.json()

    const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({
            name: body.name,
            description: body.description,
            requirement: body.requirement,
            color: body.color ?? '#9ca3af',
            text_color: body.text_color ?? '#ffffff',
        }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
}