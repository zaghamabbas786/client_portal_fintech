import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCheckInEmail } from '@/lib/resend'

/** Prevent caching so cron always executes (Vercel may serve cached response otherwise). */
export const dynamic = 'force-dynamic'

/**
 * Vercel Cron: runs daily at 8:12 PM Pakistan time (15:12 UTC).
 * Sends 30-day check-in email with Calendly link
 * to users who joined 30 days ago and haven't received it yet.
 *
 * Test mode: ?test=1 sends one email to TEST_USER_EMAIL (no 30-day filter).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const userAgent = req.headers.get('user-agent') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = userAgent === 'vercel-cron/1.0'
  const hasValidAuth = !cronSecret || authHeader === `Bearer ${cronSecret}`

  if (!hasValidAuth && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isManualTest = req.nextUrl.searchParams.get('test') === '1'
  const rawCalendly = process.env.NEXT_PUBLIC_CALENDLY_URL
  const isTestMode = !rawCalendly || rawCalendly.includes('YOUR_CALENDLY')
  const calendlyUrl: string = isTestMode ? 'https://calendly.com' : (rawCalendly ?? 'https://calendly.com')
  const hasResendKey = !!process.env.RESEND_API_KEY
  console.log('[check-in-email] Calendly URL:', calendlyUrl, '| Test mode:', isTestMode, '| RESEND_API_KEY:', hasResendKey ? 'set' : 'MISSING')

  if (isManualTest) {
    const testEmail = process.env.TEST_USER_EMAIL
    if (!testEmail) {
      return NextResponse.json({ error: 'TEST_USER_EMAIL not set for test mode' }, { status: 400 })
    }
    const result = await sendCheckInEmail({
      to: testEmail,
      name: 'Test User',
      calendlyUrl,
    })
    return NextResponse.json({
      ok: result.success,
      test: true,
      sent: result.success ? 1 : 0,
      error: result.error,
    })
  }

  // Only users who joined 29–31 days ago (30-day check-in window)
  const now = new Date()
  const startDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
  const endDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      checkInEmailSentAt: null,
      emailNotifications: true,
    },
    select: { id: true, email: true, fullName: true },
  })

  console.log('[check-in-email] Users found:', users.length)

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    const result = await sendCheckInEmail({
      to: user.email,
      name: user.fullName,
      calendlyUrl,
    })

    if (result.success) {
      await prisma.user.update({
        where: { id: user.id },
        data: { checkInEmailSentAt: new Date() },
      })
      sent++
    } else {
      errors.push(`${user.email}: ${result.error}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: users.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
