'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import Pagination from '@/components/admin/Pagination'

type Status = 'PENDING' | 'REVIEWED' | 'APPROVED' | 'DECLINED'

interface EARequestRow {
  id: string
  eaName: string | null
  message: string
  status: string
  createdAt: string
  user: { id: string; fullName: string | null; email: string; role: string }
}

const STATUS_META: Record<Status, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending', bg: 'var(--gold-s)', color: 'var(--gold)' },
  REVIEWED: { label: 'Reviewed', bg: 'var(--blue-s)', color: 'var(--blue)' },
  APPROVED: { label: 'Approved', bg: 'var(--green-s)', color: 'var(--green)' },
  DECLINED: { label: 'Declined', bg: 'var(--red-s)', color: 'var(--red)' },
}

export default function AdminEARequestsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ea-requests', page, statusFilter],
    queryFn: (): Promise<{ requests: EARequestRow[]; total: number; page: number; totalPages: number; counts?: Record<string, number> }> => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      return fetch(`/api/admin/ea-requests?${params}`).then((r) => r.json())
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      fetch(`/api/admin/ea-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ea-requests'] })
    },
  })

  const requests = data?.requests ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const counts = data?.counts ?? {}
  const pendingCount = counts.PENDING ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <KeyRound size={20} style={{ color: 'var(--text-2)' }} /> EA Requests
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          {pendingCount} pending · {counts.ALL ?? total} total
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['ALL', 'PENDING', 'REVIEWED', 'APPROVED', 'DECLINED'] as (Status | 'ALL')[]).map((s) => {
          const meta = s !== 'ALL' ? STATUS_META[s as Status] : null
          const count = s === 'ALL' ? (counts.ALL ?? 0) : (counts[s] ?? 0)
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5"
              style={{
                background: statusFilter === s ? (meta ? meta.bg : 'var(--red-s)') : 'var(--bg-2)',
                color: statusFilter === s ? (meta ? meta.color : 'var(--red)') : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              {s === 'ALL' ? 'All' : STATUS_META[s as Status].label}
              <span className="font-mono text-[10px]">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 140px 100px 120px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>REQUEST</span><span>USER</span><span>CREATED</span><span>STATUS</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
        ) : requests.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>No EA requests found.</div>
        ) : (
          <>
          {requests.map((req) => {
            const meta = STATUS_META[req.status as Status] ?? STATUS_META.PENDING
            const isExpanded = expandedId === req.id
            return (
              <div
                key={req.id}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <div
                  className="grid px-5 py-3 text-[13px] items-center cursor-pointer transition-all hover:bg-[var(--bg-3)]"
                  style={{ gridTemplateColumns: '1fr 140px 100px 120px' }}
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-1)' }}>
                      {req.eaName || 'EA Request'}
                    </div>
                    <div className="text-[11px] truncate max-w-[300px]" style={{ color: 'var(--text-3)' }}>
                      {req.message}
                    </div>
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                    {req.user.fullName || req.user.email.split('@')[0]}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                    {formatRelativeTime(req.createdAt)}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus.mutate({ id: req.id, status: e.target.value as Status })}
                      disabled={updateStatus.isPending}
                      className="text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer outline-none"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {(Object.keys(STATUS_META) as Status[]).map((s) => (
                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className={isExpanded ? 'rotate-180' : ''} style={{ color: 'var(--text-3)' }} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 pt-0" style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                    <div className="text-[12px] mb-2" style={{ color: 'var(--text-3)' }}>
                      <strong style={{ color: 'var(--text-2)' }}>Message:</strong>
                    </div>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
                      {req.message}
                    </p>
                    <div className="mt-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {req.user.email} · {req.user.role}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
