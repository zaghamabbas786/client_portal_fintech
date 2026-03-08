'use client'

import { useState } from 'react'
import { Ticket, Plus, X, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useTickets, useCreateTicket } from '@/hooks/useSupport'

const STATUS_META = {
  OPEN: { label: 'Open', bg: 'var(--blue-s)', color: 'var(--blue)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'var(--gold-s)', color: 'var(--gold)' },
  RESOLVED: { label: 'Resolved', bg: 'var(--green-s)', color: 'var(--green)' },
}

const PRIORITY_META = {
  LOW: { label: 'Low', bg: 'var(--green-s)', color: 'var(--green)' },
  MEDIUM: { label: 'Medium', bg: 'var(--gold-s)', color: 'var(--gold)' },
  HIGH: { label: 'High', bg: 'var(--red-s)', color: 'var(--red)' },
}

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

  const { data: tickets = [], isLoading } = useTickets()
  const createTicket = useCreateTicket()

  const formError = createTicket.error?.message ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createTicket.mutate(
      { subject, description, priority },
      {
        onSuccess: () => {
          setSubject('')
          setDescription('')
          setPriority('MEDIUM')
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Ticket size={20} style={{ color: 'var(--text-2)' }} /> Support
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Submit and track your support requests.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[7px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--red)' }}
        >
          <Plus size={14} /> New Ticket
        </button>
      </div>

      {/* New ticket modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-[520px] rounded-xl p-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>New Support Ticket</h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-3)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: 'var(--red-s)', color: 'var(--red)', border: '1px solid rgba(229,57,53,0.2)' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicket.isPending}
                  className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--red)' }}
                >
                  {createTicket.isPending && <Loader2 size={14} className="animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets list */}
      {isLoading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
          <Loader2 size={24} className="mx-auto animate-spin mb-3" />
          <p>Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
          <Ticket size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-[14px]">No support tickets yet.</p>
          <p className="text-[12px] mt-1">Click &quot;New Ticket&quot; to get help.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusMeta = STATUS_META[ticket.status]
            const priorityMeta = PRIORITY_META[ticket.priority]
            return (
              <div
                key={ticket.id}
                className="rounded-[10px] px-5 py-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:border-[#333345]"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-3)' }}>
                      #{ticket.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: priorityMeta.bg, color: priorityMeta.color }}>
                      {priorityMeta.label}
                    </span>
                  </div>
                  <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{ticket.subject}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {formatRelativeTime(ticket.createdAt)} · {ticket._count?.replies ?? 0} replies
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
