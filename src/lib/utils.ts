import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatCurrencyDetailed(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDate(date: Date | string, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, fmt)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    STANDARD: 'Standard Client',
    AURUM: 'Aurum Client',
    BOARDROOM: '7-Figure Boardroom',
    ADMIN: 'Admin',
  }
  return labels[role] ?? role
}

export function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    PAYOUT: 'PAYOUT',
    AURUM_RESULTS: 'AURUM',
    CHALLENGE_PASSED: 'CHALLENGE',
    GENERAL: 'GENERAL',
    QUESTION: 'QUESTION',
  }
  return labels[tag] ?? tag
}
