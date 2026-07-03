import { getUserIdFromRequest } from '@/lib/getAuthUser'
import { NextResponse } from 'next/server'

// TODO: wire to the Render backend's history-retrieve/create endpoints once available.
// For now this is in-memory only (POST echoes back what it received so the dashboard can
// show the just-submitted evaluation), nothing is persisted across requests.

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json([])
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  return NextResponse.json({
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
    user_story: body.user_story_title ?? '',
    acceptance_criteria: '',
    azure_work_item_id: body.azure_work_item_id,
    github_url: body.github_url ?? '',
    score: body.score,
    code_quality: body.code_quality,
    summary: body.summary,
    met_criteria: body.passed,
    failed_criteria: body.failed,
    improvements: body.improvements,
    notes: body.notes ?? [],
  })
}
