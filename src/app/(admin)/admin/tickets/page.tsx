'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ticket, X, Loader2, Send, Trash2, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface AdminTicket {
  id: string
  subject: string
  description: string
  priority: Priority
  status: Status
  createdAt: string
  user: { id: string; fullName: string | null; email: string }
  _count: { replies: number }
}

interface Reply {
  id: string
  content: string
  isAdmin: boolean
  createdAt: string
  user: { fullName: string | null; email: string }
}

interface TicketDetail extends AdminTicket {
  replies: Reply[]
}

const STATUS_META: Record<Status, { label: string; bg: string; color: string }> = {
  OPEN: { label: 'Open', bg: 'var(--blue-s)', color: 'var(--blue)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'var(--gold-s)', color: 'var(--gold)' },
  RESOLVED: { label: 'Resolved', bg: 'var(--green-s)', color: 'var(--green)' },
}
const PRIORITY_META: Record<Priority, { label: string; bg: string; color: string }> = {
  LOW: { label: 'Low', bg: 'var(--green-s)', color: 'var(--green)' },
  MEDIUM: { label: 'Medium', bg: 'var(--gold-s)', color: 'var(--gold)' },
  HIGH: { label: 'High', bg: 'var(--red-s)', color: 'var(--red)' },
}

// ─── Ticket detail modal ──────────────────────────────────────────────────────

function TicketModal({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [reply, setReply] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ticket', ticketId],
    queryFn: (): Promise<{ ticket: TicketDetail }> =>
      fetch(`/api/admin/tickets/${ticketId}`).then((r) => r.json()),
  })

  const updateStatus = useMutation({
    mutationFn: (status: Status) =>
      fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', ticketId] })
    },
  })

  const sendReply = useMutation({
    mutationFn: (content: string) =>
      fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setReply('')
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
    },
  })

  const ticket = data?.ticket

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl rounded-xl flex flex-col" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-1)' }}>
              {ticket?.subject ?? 'Loading…'}
            </h2>
            {ticket && (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                {ticket.user.fullName || ticket.user.email} · {formatRelativeTime(ticket.createdAt)}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
        ) : ticket ? (
          <>
            {/* Status + priority controls */}
            <div className="flex items-center gap-3 px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>STATUS</span>
              <div className="flex gap-1.5">
                {(Object.keys(STATUS_META) as Status[]).map((s) => {
                  const meta = STATUS_META[s]
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate(s)}
                      disabled={updateStatus.isPending}
                      className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: ticket.status === s ? meta.bg : 'var(--bg-3)',
                        color: ticket.status === s ? meta.color : 'var(--text-3)',
                        border: ticket.status === s ? `1px solid ${meta.color}` : '1px solid transparent',
                      }}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
              <span className="ml-auto">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: PRIORITY_META[ticket.priority].bg, color: PRIORITY_META[ticket.priority].color }}>
                  {ticket.priority}
                </span>
              </span>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {/* Original message */}
              <div className="rounded-lg p-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>
                    {ticket.user.fullName || ticket.user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{formatRelativeTime(ticket.createdAt)}</span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{ticket.description}</p>
              </div>

              {/* Replies */}
              {ticket.replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg p-4"
                  style={{
                    background: r.isAdmin ? 'rgba(229,57,53,0.06)' : 'var(--bg-1)',
                    border: r.isAdmin ? '1px solid rgba(229,57,53,0.2)' : '1px solid var(--border)',
                    marginLeft: r.isAdmin ? '24px' : '0',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-semibold" style={{ color: r.isAdmin ? 'var(--red)' : 'var(--text-1)' }}>
                      {r.user.fullName || r.user.email.split('@')[0]}
                      {r.isAdmin && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--red-s)', color: 'var(--red)' }}>ADMIN</span>}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{formatRelativeTime(r.createdAt)}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{r.content}</p>
                </div>
              ))}
            </div>

            {/* Reply input */}
            <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) sendReply.mutate(reply) }}
                  placeholder="Write a reply… (⌘+Enter to send)"
                  rows={2}
                  className="flex-1 rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                />
                <button
                  onClick={() => sendReply.mutate(reply)}
                  disabled={!reply.trim() || sendReply.isPending}
                  className="px-4 rounded-lg flex items-center gap-2 text-[13px] font-semibold text-white self-end py-2.5 transition-all"
                  style={{ background: !reply.trim() ? '#7a1a18' : 'var(--red)', opacity: !reply.trim() ? 0.5 : 1 }}
                >
                  {sendReply.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Reply
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tickets'],
    queryFn: (): Promise<{ tickets: AdminTicket[] }> =>
      fetch('/api/admin/tickets').then((r) => r.json()),
  })

  const deleteTicket = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      setConfirmDelete(null)
    },
  })

  const tickets = data?.tickets ?? []
  const filtered = statusFilter === 'ALL' ? tickets : tickets.filter((t) => t.status === statusFilter)
  const openCount = tickets.filter((t) => t.status !== 'RESOLVED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Ticket size={20} style={{ color: 'var(--text-2)' }} /> Support Tickets
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            {openCount} open · {tickets.length} total
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as (Status | 'ALL')[]).map((s) => {
          const meta = s !== 'ALL' ? STATUS_META[s as Status] : null
          const count = s === 'ALL' ? tickets.length : tickets.filter((t) => t.status === s).length
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
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
          style={{ gridTemplateColumns: '1fr 160px 80px 100px 110px 70px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>TICKET</span><span>USER</span><span>PRIORITY</span><span>CREATED</span><span>STATUS</span><span className="text-right">ACTION</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>No tickets found.</div>
        ) : (
          filtered.map((ticket) => {
            const statusMeta = STATUS_META[ticket.status]
            const priorityMeta = PRIORITY_META[ticket.priority]
            return (
              <div
                key={ticket.id}
                className="grid px-5 py-3 text-[13px] items-center cursor-pointer transition-all hover:bg-[var(--bg-3)]"
                style={{ gridTemplateColumns: '1fr 160px 80px 100px 110px 70px', borderBottom: '1px solid var(--border)' }}
                onClick={() => setSelectedId(ticket.id)}
              >
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-1)' }}>{ticket.subject}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                    #{ticket.id.slice(0, 6).toUpperCase()} · {ticket._count.replies} replies
                  </div>
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                  {ticket.user.fullName || ticket.user.email.split('@')[0]}
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: priorityMeta.bg, color: priorityMeta.color }}>
                  {priorityMeta.label}
                </span>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{formatRelativeTime(ticket.createdAt)}</div>
                <span className="text-[10px] font-bold px-[9px] py-[3px] rounded-full w-fit" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setConfirmDelete(ticket.id)}
                    className="p-1.5 rounded-lg"
                    style={{ color: 'var(--red)', background: 'var(--red-s)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedId && <TicketModal ticketId={selectedId} onClose={() => setSelectedId(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: 'var(--red)' }} />
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text-1)' }}>Delete Ticket?</h3>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>This will permanently delete the ticket and all replies.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                Cancel
              </button>
              <button
                onClick={() => deleteTicket.mutate(confirmDelete)}
                disabled={deleteTicket.isPending}
                className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--red)' }}
              >
                {deleteTicket.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
