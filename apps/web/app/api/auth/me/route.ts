import { NextResponse } from 'next/server'

const BACKEND_URL = 'https://tfc-userstories.onrender.com/auth/me'

function mapUser(data: Record<string, unknown>) {
  return {
    user_id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    organization_id: data.organization_id ?? null,
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return NextResponse.json(null, { status: 401 })

  const res = await fetch(BACKEND_URL, { headers: { Authorization: authHeader } })
  if (!res.ok) return NextResponse.json(null, { status: res.status })
  return NextResponse.json(mapUser(await res.json()))
}
