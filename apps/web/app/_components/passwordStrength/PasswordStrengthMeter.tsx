'use client'

export type PasswordRequirement = {
  key: string
  label: string
  test: (pwd: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { key: 'length', label: 'At least 8 characters', test: pwd => pwd.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: pwd => /[A-Z]/.test(pwd) },
  { key: 'number', label: 'One number', test: pwd => /[0-9]/.test(pwd) },
  { key: 'special', label: 'One special character', test: pwd => /[^A-Za-z0-9]/.test(pwd) },
]

export function getFailedRequirements(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter(r => !r.test(password)).map(r => r.label)
}

type Strength = 'weak' | 'medium' | 'strong'

const STRENGTH_CONFIG: Record<Strength, { label: string; barColor: string; textColor: string; segments: number }> = {
  weak: { label: 'Weak', barColor: 'bg-red-500', textColor: 'text-red-500', segments: 1 },
  medium: { label: 'Medium', barColor: 'bg-yellow-400', textColor: 'text-yellow-500', segments: 2 },
  strong: { label: 'Strong', barColor: 'bg-green-500', textColor: 'text-green-600', segments: 3 },
}

function getStrength(passedCount: number, total: number): Strength {
  if (passedCount >= total) return 'strong'
  if (passedCount >= Math.ceil(total / 2)) return 'medium'
  return 'weak'
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const passedCount = PASSWORD_REQUIREMENTS.filter(r => r.test(password)).length
  const strength = getStrength(passedCount, PASSWORD_REQUIREMENTS.length)
  const config = STRENGTH_CONFIG[strength]

  return (
    <div className="flex flex-col gap-2 mt-1.5">
      {/* Segmented strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                i < config.segments ? config.barColor : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
      </div>

      {/* Requirements checklist */}
      <ul className="flex flex-col gap-1">
        {PASSWORD_REQUIREMENTS.map(req => {
          const ok = req.test(password)
          return (
            <li
              key={req.key}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
                ok ? 'text-green-600' : 'text-slate-400'
              }`}
            >
              {ok ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
              {req.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
