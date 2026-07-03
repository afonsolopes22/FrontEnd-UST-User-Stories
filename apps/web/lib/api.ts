const EVALUATE_URL = "https://tfc-userstories.onrender.com/evaluate/azure/sync"

export type EvaluateRequest = {
  work_item_id: number
  organization_id: number
  branch: string
}

export type EvaluateResponse = {
  score: number
  code_quality: number
  user_story_title: string
  summary: string
  passed: string[]
  failed: string[]
  improvements: string[]
  github_url: string
  pr_url: string | null
  azure_work_item_id: number
}

export async function evaluateUserStory(payload: EvaluateRequest): Promise<EvaluateResponse> {
  const res = await fetch(EVALUATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail ?? body?.message ?? body?.error ?? res.statusText
    throw new Error(`${res.status}: ${detail}`)
  }

  return res.json()
}
