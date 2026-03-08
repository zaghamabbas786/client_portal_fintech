import {
  cn,
  formatCurrency,
  formatCurrencyDetailed,
  formatRelativeTime,
  formatDate,
  getInitials,
  getRoleLabel,
  getTagLabel,
} from '@/lib/utils'

// ─── cn (class merging) ───────────────────────────────────────────────────────
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
  it('deduplicates Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
  it('handles undefined/null gracefully', () => {
    expect(cn('foo', undefined, null as any)).toBe('foo')
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats whole number', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
  })
  it('formats string input', () => {
    expect(formatCurrency('4218')).toBe('$4,218')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
  it('formats large number with commas', () => {
    expect(formatCurrency(123456)).toBe('$123,456')
  })
  it('truncates decimals', () => {
    expect(formatCurrency(1234.99)).toBe('$1,235')
  })
})

// ─── formatCurrencyDetailed ───────────────────────────────────────────────────
describe('formatCurrencyDetailed', () => {
  it('formats with 2 decimal places', () => {
    expect(formatCurrencyDetailed(1000)).toBe('$1,000.00')
  })
  it('formats string input with decimals', () => {
    expect(formatCurrencyDetailed('8613.50')).toBe('$8,613.50')
  })
  it('pads single decimal', () => {
    expect(formatCurrencyDetailed(100.5)).toBe('$100.50')
  })
})

// ─── formatRelativeTime ───────────────────────────────────────────────────────
describe('formatRelativeTime', () => {
  it('returns relative string for a recent date', () => {
    const recent = new Date(Date.now() - 60_000) // 1 minute ago
    const result = formatRelativeTime(recent)
    expect(result).toMatch(/minute|ago/)
  })
  it('accepts ISO string', () => {
    const isoStr = new Date(Date.now() - 3600_000).toISOString()
    const result = formatRelativeTime(isoStr)
    expect(result).toMatch(/hour|ago/)
  })
  it('accepts Date object', () => {
    const d = new Date(Date.now() - 86400_000) // 1 day ago
    const result = formatRelativeTime(d)
    expect(result).toMatch(/day|ago/)
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats with default pattern', () => {
    const d = new Date(2026, 2, 8) // March 8 2026
    expect(formatDate(d)).toBe('Mar 8, 2026')
  })
  it('formats with custom pattern', () => {
    const d = new Date(2026, 2, 8)
    expect(formatDate(d, 'yyyy-MM-dd')).toBe('2026-03-08')
  })
  it('accepts ISO string', () => {
    expect(formatDate('2026-03-08T00:00:00.000Z', 'yyyy')).toBe('2026')
  })
})

// ─── getInitials ──────────────────────────────────────────────────────────────
describe('getInitials', () => {
  it('returns initials for full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })
  it('returns single initial for a single-word name', () => {
    expect(getInitials('Marcus')).toBe('M')
  })
  it('handles three-word names (takes first two initials)', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })
  it('uppercases result', () => {
    expect(getInitials('alice bob')).toBe('AB')
  })
  it('handles single-word strings (no spaces)', () => {
    expect(getInitials('johndoe')).toBe('J')
  })
})

// ─── getRoleLabel ─────────────────────────────────────────────────────────────
describe('getRoleLabel', () => {
  it('maps STANDARD', () => {
    expect(getRoleLabel('STANDARD')).toBe('Standard Client')
  })
  it('maps AURUM', () => {
    expect(getRoleLabel('AURUM')).toBe('Aurum Client')
  })
  it('maps BOARDROOM', () => {
    expect(getRoleLabel('BOARDROOM')).toBe('7-Figure Boardroom')
  })
  it('maps ADMIN', () => {
    expect(getRoleLabel('ADMIN')).toBe('Admin')
  })
  it('falls back to raw value for unknown roles', () => {
    expect(getRoleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE')
  })
})

// ─── getTagLabel ──────────────────────────────────────────────────────────────
describe('getTagLabel', () => {
  it('maps PAYOUT', () => {
    expect(getTagLabel('PAYOUT')).toBe('PAYOUT')
  })
  it('maps AURUM_RESULTS', () => {
    expect(getTagLabel('AURUM_RESULTS')).toBe('AURUM')
  })
  it('maps CHALLENGE_PASSED', () => {
    expect(getTagLabel('CHALLENGE_PASSED')).toBe('CHALLENGE')
  })
  it('maps GENERAL', () => {
    expect(getTagLabel('GENERAL')).toBe('GENERAL')
  })
  it('maps QUESTION', () => {
    expect(getTagLabel('QUESTION')).toBe('QUESTION')
  })
  it('falls back for unknown tag', () => {
    expect(getTagLabel('CUSTOM_TAG')).toBe('CUSTOM_TAG')
  })
})
