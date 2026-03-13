import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCheckInEmail } from '@/lib/resend'

/**
 * Vercel Cron: runs daily. Sends 30-day check-in email with Calendly link
 * to users who joined 30 days ago and haven't received it yet.
 *
 * Test mode: ?test=1 sends one email to TEST_USER_EMAIL (no 30-day filter).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isTest = req.nextUrl.searchParams.get('test') === '1'
  let calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL
  console.log('[check-in-email] Calendly URL:', calendlyUrl)
  if (!calendlyUrl || calendlyUrl.includes('YOUR_CALENDLY')) {
    if (isTest) {
      calendlyUrl = 'https://calendly.com' // placeholder for test
    } else {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_CALENDLY_URL not configured' },
        { status: 503 }
      )
    }
  }

  if (isTest) {
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

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const twentyNineDaysAgo = new Date(now)
  twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29)
  const thirtyOneDaysAgo = new Date(now)
  thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31)

  // Users who joined 29–31 days ago (window to catch daily cron)
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: thirtyOneDaysAgo,
        lte: twentyNineDaysAgo,
      },
      checkInEmailSentAt: null,
      emailNotifications: true,
    },
    select: { id: true, email: true, fullName: true },
  })

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
