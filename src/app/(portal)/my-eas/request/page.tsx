'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { KeyRound, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default function EARequestPage() {
  const qc = useQueryClient()
  const [eaName, setEaName] = useState('')
  const [message, setMessage] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ea-requests'],
    queryFn: async () => {
      const res = await fetch('/api/ea-requests')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      return data.requests ?? []
    },
  })

  const createRequest = useMutation({
    mutationFn: async (body: { eaName?: string; message: string }) => {
      const res = await fetch('/api/ea-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      let data: { request?: unknown; error?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(res.ok ? 'Invalid response from server' : 'Failed to submit request')
      }
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      return data
    },
    onSuccess: () => {
      setEaName('')
      setMessage('')
      qc.invalidateQueries({ queryKey: ['ea-requests'] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = message.trim()
    if (!msg || createRequest.isPending) return
    createRequest.mutate({ eaName: eaName.trim() || undefined, message: msg })
  }

  const formError = createRequest.error?.message ?? ''

  return (
    <div>
      <Link
        href="/my-eas"
        className="inline-flex items-center gap-2 text-[13px] mb-6 hover:opacity-80"
        style={{ color: 'var(--text-2)' }}
      >
        <ArrowLeft size={14} /> Back to My EAs
      </Link>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <KeyRound size={20} style={{ color: 'var(--text-2)' }} /> Request EA
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Submit a request for an Expert Advisor. Our team will review and get back to you.
        </p>
      </div>

      {/* Form */}
      <div
        className="rounded-[10px] p-6 mb-6"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
          New EA Request
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div
              className="px-4 py-3 rounded-lg text-[13px]"
              style={{ background: 'var(--red-s)', color: 'var(--red)', border: '1px solid rgba(229,57,53,0.2)' }}
            >
              {formError}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
              EA name (optional)
            </label>
            <input
              type="text"
              value={eaName}
              onChange={(e) => setEaName(e.target.value)}
              placeholder="e.g. Aurum EA, Omni EA"
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Tell us which EA you'd like to request and any relevant details (account type, broker, etc.)."
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || createRequest.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--red)' }}
          >
            {createRequest.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Submit Request
          </button>
        </form>
      </div>

      {/* My requests */}
      <div
        className="rounded-[10px] p-6"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
          Your Requests
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[13px]">Loading…</span>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-[13px] py-2" style={{ color: 'var(--text-3)' }}>
            No requests yet. Submit one above.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r: { id: string; eaName: string | null; message: string; status: string; createdAt: string }) => (
              <div
                key={r.id}
                className="rounded-[8px] px-4 py-3"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>
                    {r.eaName || 'EA Request'}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        r.status === 'PENDING' ? 'var(--gold-s)' : r.status === 'APPROVED' ? 'var(--green-s)' : 'var(--bg-3)',
                      color:
                        r.status === 'PENDING' ? 'var(--gold)' : r.status === 'APPROVED' ? 'var(--green)' : 'var(--text-3)',
                    }}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-[12px] mb-1" style={{ color: 'var(--text-2)' }}>
                  {r.message}
                </p>
                <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
