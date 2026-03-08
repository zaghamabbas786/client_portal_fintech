'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
          Create your account
        </h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-2)' }}>
          Join the EOS Capital Tech community
        </p>

        {success ? (
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: 'var(--green-s)', border: '1px solid rgba(0,200,83,0.2)' }}
          >
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--green)' }}>
              Account created!
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-2)' }}>
              Check your email to confirm your account, then{' '}
              <Link href="/login" style={{ color: 'var(--red)' }} className="font-semibold">
                sign in
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
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
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Andrew Bell"
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
                  placeholder="Min 8 characters"
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-[12px] mt-5" style={{ color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--red)' }} className="font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
