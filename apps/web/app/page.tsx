'use client'

import { useEffect, useState, FormEvent } from "react"
import { useAuth, AuthUser } from "@/app/_context/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PasswordStrengthMeter, { getFailedRequirements } from "@/app/_components/passwordStrength/PasswordStrengthMeter"

const API_BASE = 'https://tfc-userstories.onrender.com'

function DevLensLogo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#5236ab" />
      <circle cx="28" cy="28" r="11" stroke="white" strokeWidth="4" fill="none" />
      <line x1="36" y1="36" x2="48" y2="48" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <circle cx="28" cy="28" r="5" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

type AuthTab = 'login' | 'register'

function LoginForm({ onSuccess }: { onSuccess: (token: string, user: AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required.'
    if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address.'
    if (!isAllowedEmailDomain(email)) return 'Email domain not allowed. Use a valid provider (Gmail, Outlook, CGI…).'
    if (!password) return 'Password is required.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail ?? 'Invalid email or password.')
      onSuccess(data.access_token, {
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="text"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="your@email.com"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pr-9"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full mt-1">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

type RegisterErrors = { name?: string; email?: string; password?: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.pt', 'outlook.co.uk',
  'live.com', 'live.co.uk', 'live.pt',
  'cgi.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr',
  'icloud.com', 'me.com', 'mac.com',
  'sapo.pt', 'iol.pt',
])

function isAllowedEmailDomain(email: string): boolean {
  const domain = email.trim().split('@')[1]?.toLowerCase()
  return !!domain && ALLOWED_EMAIL_DOMAINS.has(domain)
}

function RegisterForm({ onSuccess }: { onSuccess: (token: string, user: AuthUser) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const clearField = (field: keyof RegisterErrors) =>
    setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })

  const validate = (): RegisterErrors => {
    const errs: RegisterErrors = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!EMAIL_REGEX.test(email.trim())) errs.email = 'Enter a valid email address.'
    else if (!isAllowedEmailDomain(email)) errs.email = 'Email domain not allowed. Use a valid provider (Gmail, Outlook, CGI…).'
    if (!password) errs.password = 'Password is required.'
    else if (getFailedRequirements(password).length > 0) errs.password = 'Password does not meet all requirements.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setApiError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail ?? 'Registration failed.')
      onSuccess(data.access_token, {
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
      })
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="register-name" className={fieldErrors.name ? 'text-red-500' : ''}>Name</Label>
        <Input
          id="register-name"
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); clearField('name') }}
          placeholder="Your name"
          autoComplete="name"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && <p className="text-red-500 text-xs">{fieldErrors.name}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="register-email" className={fieldErrors.email ? 'text-red-500' : ''}>Email</Label>
        <Input
          id="register-email"
          type="text"
          value={email}
          onChange={e => { setEmail(e.target.value); clearField('email') }}
          placeholder="your@email.com"
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && <p className="text-red-500 text-xs">{fieldErrors.email}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="register-password" className={fieldErrors.password ? 'text-red-500' : ''}>Password</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); clearField('password') }}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            className="pr-9"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {(passwordFocused || password.length > 0) && <PasswordStrengthMeter password={password} />}
        {fieldErrors.password && <p className="text-red-500 text-xs">{fieldErrors.password}</p>}
      </div>
      {apiError && <p className="text-red-500 text-xs">{apiError}</p>}
      <Button type="submit" disabled={loading} className="w-full mt-1">
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  )
}

function LandingPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AuthTab>('login')

  const handleAuthSuccess = (token: string, user: AuthUser) => {
    signIn(token, user)
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 pt-4 pb-2 text-center">
        <div className="flex items-center gap-3 mb-2">
          <DevLensLogo />
          <span className="text-4xl font-bold tracking-tight text-slate-900">DevLens</span>
        </div>

        <p className="text-lg text-slate-500 max-w-md leading-relaxed">
          Analyze user stories and code to ensure<br />
          high-quality implementation and best practices.
        </p>

        {/* Auth card */}
        <div className="mt-1 w-full max-w-sm mb-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'bg-[#5236ab] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'bg-[#5236ab] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Register
              </button>
            </div>

            {activeTab === 'login'
              ? <LoginForm onSuccess={handleAuthSuccess} />
              : <RegisterForm onSuccess={handleAuthSuccess} />
            }
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-2xl mb-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-8 py-4">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 text-left">How it works</p>
            <div className="flex items-start justify-between gap-2">

              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5236ab" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700">Connect Azure DevOps</span>
                <span className="text-xs text-slate-400 leading-relaxed">Link your org and PAT in Settings</span>
              </div>

              <div className="flex items-center pt-5 text-slate-300 text-lg flex-shrink-0">→</div>

              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700">Enter a Work Item ID</span>
                <span className="text-xs text-slate-400 leading-relaxed">Paste the Azure DevOps ID in Analyze</span>
              </div>

              <div className="flex items-center pt-5 text-slate-300 text-lg flex-shrink-0">→</div>

              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700">Get instant feedback</span>
                <span className="text-xs text-slate-400 leading-relaxed">Scores, met criteria, and improvements</span>
              </div>

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-2 max-w-4xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">User Story Validation</p>
            <p className="text-sm text-slate-500 leading-relaxed">Verify clarity, acceptance criteria, and overall completeness.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5236ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">Code Quality Check</p>
            <p className="text-sm text-slate-500 leading-relaxed">Detect bad practices, complexity, and coding standard violations.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <circle cx="18" cy="7" r="2" fill="#7c3aed" stroke="none" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800">Actionable Feedback</p>
            <p className="text-sm text-slate-500 leading-relaxed">Receive clear, actionable suggestions for improvement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedHome() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return null
}

export default function Home() {
  const { status } = useAuth()

  if (status === 'loading') return null
  if (status === 'unauthenticated') return <LandingPage />

  return <AuthenticatedHome />
}
