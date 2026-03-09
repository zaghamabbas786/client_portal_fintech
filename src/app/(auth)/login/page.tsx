'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setMagicLoading(true)
    setError('')
    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${baseUrl}/auth/callback` },
    })
    setMagicLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center font-black text-lg text-white"
          style={{ background: 'var(--red)' }}
        >
          E
        </div>
        <div>
          <div className="text-[14px] font-bold tracking-[0.3px]" style={{ color: 'var(--text-1)' }}>
            EOS CAPITAL TECH
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            Client Portal
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-7"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>
          Welcome back
        </h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-2)' }}>
          Sign in to your account to continue
        </p>

        {magicSent ? (
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: 'var(--green-s)', border: '1px solid rgba(0,200,83,0.2)' }}
          >
            <div className="text-2xl mb-2">📧</div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--green)' }}>
              Magic link sent!
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-2)' }}>
              Check your email and click the link to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-[13px]"
                style={{ background: 'var(--red-s)', color: 'var(--red)', border: '1px solid rgba(229,57,53,0.2)' }}
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors"
                style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-[13px] outline-none transition-colors"
                  style={{
                    background: 'var(--bg-1)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? '#b71c1c' : 'var(--red)' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="px-3 text-[11px]" style={{ color: 'var(--text-3)' }}>
                or
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLoading}
              className="w-full rounded-lg py-2.5 text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              {magicLoading && <Loader2 size={14} className="animate-spin" />}
              ✉️ Send Magic Link
            </button>
          </form>
        )}

        <p className="text-center text-[12px] mt-5" style={{ color: 'var(--text-3)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--red)' }} className="font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px]">
        <div className="rounded-xl p-7" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
