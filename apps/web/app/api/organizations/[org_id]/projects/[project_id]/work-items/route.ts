import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BASE = 'https://tfc-userstories.onrender.com'

export async function GET(request: Request, { params }: { params: Promise<{ org_id: string; project_id: string }> }) {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { org_id, project_id } = await params
    const auth = request.headers.get('Authorization') ?? ''
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ?? '100'

    const res = await fetch(`${BASE}/organizations/${org_id}/projects/${project_id}/work-items?limit=${limit}`, {
        headers: { Authorization: auth },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => null)
        return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : [])
}