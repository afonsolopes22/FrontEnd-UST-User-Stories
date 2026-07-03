// BACKUP: Streaming render logic from user-story/page.tsx
// Endpoint: https://tfc-userstories.onrender.com/evaluate/azure  (SSE streaming)
// Replaced by: evaluate/azure/sync  (sync JSON)
// Saved: 2026-04-29

// ── Progressive JSON extraction ──────────────────────────────────────────────

type PartialResult = {
  score: number | null
  summary: string | null
  summaryComplete: boolean
  met_criteria: string[] | null
  failed_criteria: string[] | null
  improvements: string[] | null
}

function findCompleteArray(output: string, key: string): string[] | null {
  const keyIdx = output.indexOf(`"${key}"`)
  if (keyIdx === -1) return null
  const bracketIdx = output.indexOf('[', keyIdx + key.length + 2)
  if (bracketIdx === -1) return null

  let depth = 0
  let inStr = false
  let esc = false

  for (let i = bracketIdx; i < output.length; i++) {
    const c = output[i]
    if (esc) { esc = false; continue }
    if (c === '\\' && inStr) { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '[') depth++
    if (c === ']') {
      if (--depth === 0) {
        try { return JSON.parse(output.slice(bracketIdx, i + 1)) } catch { return null }
      }
    }
  }
  return null
}

function extractPartial(output: string): PartialResult {
  const result: PartialResult = {
    score: null,
    summary: null,
    summaryComplete: false,
    met_criteria: null,
    failed_criteria: null,
    improvements: null,
  }

  // score
  const scoreMatch = output.match(/"score"\s*:\s*(\d+)/)
  if (scoreMatch) result.score = parseInt(scoreMatch[1])

  // summary — stream character by character until closing quote
  const keyIdx = output.indexOf('"summary"')
  if (keyIdx !== -1) {
    const colonIdx = output.indexOf(':', keyIdx + 9)
    if (colonIdx !== -1) {
      const openIdx = output.indexOf('"', colonIdx + 1)
      if (openIdx !== -1) {
        const start = openIdx + 1
        let closeIdx = -1
        let esc = false
        for (let i = start; i < output.length; i++) {
          if (esc) { esc = false; continue }
          if (output[i] === '\\') { esc = true; continue }
          if (output[i] === '"') { closeIdx = i; break }
        }
        const raw = closeIdx !== -1
          ? output.slice(start, closeIdx)
          : output.slice(start)
        result.summary = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t')
        result.summaryComplete = closeIdx !== -1
      }
    }
  }

  result.met_criteria = findCompleteArray(output, 'met_criteria')
  result.failed_criteria = findCompleteArray(output, 'failed_criteria')
  result.improvements = findCompleteArray(output, 'improvements')

  return result
}

// ── runEvaluation (streaming version) ────────────────────────────────────────

async function runEvaluation_streaming(
  workItemId: string,
  EVALUATE_URL: string,
  setStreamOutput: (s: string) => void,
  setStreamDone: (d: { score: number; code_quality: number; user_story_title: string; azure_work_item_id: number; pr_url: string | null }) => void,
  addHistoryItem: Function,
  router: { replace: (url: string) => void },
) {
  const orgRes = await fetch('/api/organizations')
  const org = await orgRes.json()
  if (!org?.backend_id) throw new Error('No organization configured. Go to Settings to add one.')

  const response = await fetch(EVALUATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      work_item_id: parseInt(workItemId!),
      organization_id: parseInt(String(org.backend_id)),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.detail ?? err?.message ?? `Error ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let output = ''
  let doneData: { score: number; code_quality: number; user_story_title: string; azure_work_item_id: number; pr_url: string | null } | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') break
      const parsed = JSON.parse(raw)
      if (parsed.token) { output += parsed.token; setStreamOutput(output) }
      if (parsed.done) { doneData = parsed; setStreamDone(parsed) }
    }
  }

  if (!doneData) throw new Error('Stream ended without completion signal.')

  const parsedJson = JSON.parse(output) as {
    score: number; summary: string; met_criteria: string[]; failed_criteria: string[]; improvements: string[]; notes: string[]
  }

  await addHistoryItem({
    azure_work_item_id: String(doneData.azure_work_item_id),
    user_story_title: doneData.user_story_title ?? '',
    github_url: '',
    score: doneData.score ?? 0,
    code_quality: doneData.code_quality ?? 0,
    summary: parsedJson.summary ?? '',
    passed: parsedJson.met_criteria ?? [],
    failed: parsedJson.failed_criteria ?? [],
    improvements: parsedJson.improvements ?? [],
    notes: parsedJson.notes ?? [],
  })

  router.replace(`/user-story?work_item_id=${doneData.azure_work_item_id}`)
}

// ── Streaming view JSX (inside WorkItemDetail, when shouldEvaluate=true) ─────
/*
  State required:
    const [streaming, setStreaming] = useState(false)
    const [streamOutput, setStreamOutput] = useState('')
    const [streamError, setStreamError] = useState<string | null>(null)
    const [streamDone, setStreamDone] = useState<{ score: number; code_quality: number; user_story_title: string; azure_work_item_id: number } | null>(null)

  Render (when shouldEvaluate):
    const partial = extractPartial(streamOutput)
    const scoreValue = partial.score ?? streamDone?.score ?? null
    const qualityValue = streamDone?.code_quality ?? null

    return (
      <div className={styles.page}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>
            Work Item <span className={styles.workItemId}>#{workItemId}</span>
          </h1>
          <p className={styles.streamStatus}>
            {streamError ? '✗ Error' : streaming ? '⬤ Evaluating…' : '⬤ Starting…'}
          </p>
        </div>

        <div className={styles.scoreCard}>
          {scoreValue !== null
            ? <ScoreRing value={scoreValue} label="Score" color="#1d4ed8" />
            : <ScoreRingEmpty label="Score" />
          }
          {qualityValue !== null
            ? <ScoreRing value={qualityValue} label="Code Quality" color="#059669" />
            : <ScoreRingEmpty label="Code Quality" />
          }
          <div style={{ flex: 1, paddingLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>
            {partial.summary !== null ? (
              <p className={styles.scoreSummary}>
                {partial.summary}
                {!partial.summaryComplete && <span className={styles.cursor}>&nbsp;</span>}
              </p>
            ) : (
              <div className={styles.skeletonSummary}>
                <div className={styles.skeletonLine} style={{ width: '90%' }} />
                <div className={styles.skeletonLine} style={{ width: '75%' }} />
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.criteriaGrid}>
          {partial.met_criteria !== null ? (
            <div className={styles.criteriaCardGreen}>
              <div className={styles.criteriaHeader}>
                <span>✓</span>
                <span className={styles.criteriaLabelGreen}>PASSED ({partial.met_criteria.length})</span>
              </div>
              {partial.met_criteria.length === 0
                ? <p className={styles.criteriaEmpty}>—</p>
                : <ul className={styles.criteriaListGreen}>
                    {partial.met_criteria.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                  </ul>
              }
            </div>
          ) : <div className={styles.skeletonCard} />}

          {partial.failed_criteria !== null ? (
            <div className={styles.criteriaCardOrange}>
              <div className={styles.criteriaHeader}>
                <span>✗</span>
                <span className={styles.criteriaLabelOrange}>FAILED ({partial.failed_criteria.length})</span>
              </div>
              {partial.failed_criteria.length === 0
                ? <p className={styles.criteriaEmpty}>—</p>
                : <ul className={styles.criteriaListOrange}>
                    {partial.failed_criteria.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
                  </ul>
              }
            </div>
          ) : <div className={styles.skeletonCard} />}
        </div>

        {partial.improvements !== null && partial.improvements.length > 0 && (
          <div className={styles.improvementsCard}>
            <div className={styles.criteriaHeader}>
              <span>→</span>
              <span className={styles.improvementsLabel}>IMPROVEMENTS</span>
            </div>
            <ul className={styles.improvementsList}>
              {partial.improvements.map((c, i) => <li key={i} className={styles.criteriaItem}>{c}</li>)}
            </ul>
          </div>
        )}

        {streamError && <p className={styles.streamError}>{streamError}</p>}
      </div>
    )
*/
