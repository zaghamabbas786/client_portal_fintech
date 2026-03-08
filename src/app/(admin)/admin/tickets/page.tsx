import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { formatRelativeTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Support Tickets' }

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

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { fullName: true, email: true } },
      _count: { select: { replies: true } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
          Support Tickets
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          {tickets.filter((t) => t.status !== 'RESOLVED').length} open · {tickets.length} total
        </p>
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 160px 80px 120px 100px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>TICKET</span>
          <span>USER</span>
          <span>PRIORITY</span>
          <span>CREATED</span>
          <span>STATUS</span>
        </div>

        {tickets.map((ticket) => {
          const statusMeta = STATUS_META[ticket.status]
          const priorityMeta = PRIORITY_META[ticket.priority]
          return (
            <div
              key={ticket.id}
              className="grid px-5 py-3 text-[13px]"
              style={{ gridTemplateColumns: '1fr 160px 80px 120px 100px', borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-1)' }}>{ticket.subject}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                  #{ticket.id.slice(0, 6).toUpperCase()} · {ticket._count.replies} replies
                </div>
              </div>
              <div className="self-center">
                <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                  {ticket.user.fullName || ticket.user.email.split('@')[0]}
                </div>
              </div>
              <div className="self-center">
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: priorityMeta.bg, color: priorityMeta.color }}
                >
                  {priorityMeta.label}
                </span>
              </div>
              <div className="text-[11px] self-center" style={{ color: 'var(--text-3)' }}>
                {formatRelativeTime(ticket.createdAt)}
              </div>
              <span
                className="text-[10px] font-bold px-[9px] py-[3px] rounded-full self-center w-fit"
                style={{ background: statusMeta.bg, color: statusMeta.color }}
              >
                {statusMeta.label}
              </span>
            </div>
          )
        })}

        {tickets.length === 0 && (
          <div className="px-5 py-10 text-center" style={{ color: 'var(--text-3)' }}>
            No tickets yet.
          </div>
        )}
      </div>
    </div>
  )
}
