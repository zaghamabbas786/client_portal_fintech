'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit?: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit = 10, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1 text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
