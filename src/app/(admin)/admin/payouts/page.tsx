'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Loader2, ChevronDown, ExternalLink, Check, X } from 'lucide-react'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import Pagination from '@/components/admin/Pagination'

interface PayoutSubmissionRow {
  id: string
  propFirm: string
  amount: { toString: () => string }
  proofUrl: string
  system: string
  month: string
  year: number
  createdAt: string
  user: { id: string; fullName: string | null; email: string }
}

export default function AdminPayoutsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payouts', page],
    queryFn: (): Promise<{ submissions: PayoutSubmissionRow[]; total: number; page: number; totalPages: number }> =>
      fetch(`/api/admin/payouts?page=${page}`).then((r) => r.json()),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      fetch(`/api/admin/payouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payouts'] })
    },
  })

  const submissions = data?.submissions ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Trophy size={20} style={{ color: 'var(--text-2)' }} /> Payout Verifications
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          {total} pending · Review proof and approve for leaderboard
        </p>
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 100px 120px 100px 140px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>PAYOUT</span><span>PROP FIRM</span><span>USER</span><span>CREATED</span><span>ACTIONS</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
        ) : submissions.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>
            No pending payout submissions.
          </div>
        ) : (
          submissions.map((sub) => {
            const isExpanded = expandedId === sub.id
            const amount = parseFloat(sub.amount.toString())
            return (
              <div
                key={sub.id}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <div
                  className="grid px-5 py-3 text-[13px] items-center cursor-pointer transition-all hover:bg-[var(--bg-3)]"
                  style={{ gridTemplateColumns: '1fr 100px 120px 100px 140px' }}
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-1)' }}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {sub.system} · {sub.month} {sub.year}
                    </div>
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                    {sub.propFirm}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                    {sub.user.fullName || sub.user.email.split('@')[0]}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                    {formatRelativeTime(sub.createdAt)}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => updateStatus.mutate({ id: sub.id, action: 'approve' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{ background: 'var(--green-s)', color: 'var(--green)' }}
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: sub.id, action: 'reject' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{ background: 'var(--red-s)', color: 'var(--red)' }}
                    >
                      <X size={12} /> Reject
                    </button>
                    <ChevronDown size={12} className={isExpanded ? 'rotate-180' : ''} style={{ color: 'var(--text-3)' }} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 pt-0" style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                    <div className="text-[12px] mb-2" style={{ color: 'var(--text-3)' }}>
                      <strong style={{ color: 'var(--text-2)' }}>Proof (internal verification):</strong>
                    </div>
                    <a
                      href={sub.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] mb-3"
                      style={{ color: 'var(--red)' }}
                    >
                      <ExternalLink size={14} /> View proof (certificate/email)
                    </a>
                    <div className="mt-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {sub.user.email}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}
