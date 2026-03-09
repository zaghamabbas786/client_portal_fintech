'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Builds month/year options for the last 24 months */
function getOptions() {
  const now = new Date()
  const options: { month: string; year: number; label: string }[] = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = MONTHS[d.getMonth()]
    const year = d.getFullYear()
    options.push({ month, year, label: `${month} ${year}` })
  }
  return options
}

export default function MonthFilter({
  currentMonth,
  currentYear,
}: {
  currentMonth: string
  currentYear: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const options = getOptions()
  const value = `${currentMonth}-${currentYear}`
  const hasCurrent = options.some((o) => o.month === currentMonth && o.year === currentYear)
  const displayOptions = hasCurrent ? options : [{ month: currentMonth, year: currentYear, label: `${currentMonth} ${currentYear}` }, ...options]

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (!val) return
    const [month, year] = val.split('-')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', month)
    params.set('year', year)
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className="appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-lg text-[13px] font-medium w-full min-w-[160px] outline-none"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-1)',
        }}
        aria-label="Filter by month"
      >
        {displayOptions.map((opt) => (
          <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-3)' }}
      />
    </div>
  )
}
