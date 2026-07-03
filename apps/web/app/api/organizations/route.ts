import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

const BACKEND_URL = 'https://tfc-userstories.onrender.com/organizations'

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json(null)

  const auth = request.headers.get('Authorization') ?? ''
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    // Request a high limit so all orgs come back in one shot (default page size is 10)
    const res = await fetch(`${BACKEND_URL}?limit=1000`, { headers: { Authorization: auth } })
    if (!res.ok) return NextResponse.json([])
    const data = await res.json()
    // Backend returns { items: [...], total, ... } (paginated envelope) or a plain array
    return NextResponse.json(Array.isArray(data) ? data : (data.items ?? []))
  }

  const res = await fetch(`${BACKEND_URL}/${orgId}`, { headers: { Authorization: auth } })
  if (!res.ok) return NextResponse.json(null)
  return NextResponse.json(await res.json())
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const auth = request.headers.get('Authorization') ?? ''
  const body = await request.json()

  const backendRes = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      name: body.name,
      azure_org: body.azure_org,
      azure_pat: body.azure_pat,
    }),
  })

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => null)
    const errorMsg = err?.detail || err?.message || backendRes.statusText || `Error ${backendRes.status}`
    return NextResponse.json({ error: errorMsg }, { status: backendRes.status })
  }

  const backendData = await backendRes.json()

  return NextResponse.json({
    id: backendData.id,
    name: body.name,
    azure_org: body.azure_org,
  })
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

  const auth = request.headers.get('Authorization') ?? ''
  const res = await fetch(`${BACKEND_URL}/${orgId}`, { method: 'DELETE', headers: { Authorization: auth } })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json({ error: err?.detail ?? err?.message ?? res.statusText }, { status: res.status })
  }
  return NextResponse.json({ success: true })
}
