import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await _req.json().catch(() => ({}))
  const action = body.action // 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const submission = await prisma.payoutSubmission.findUnique({ where: { id } })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (submission.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 })
  }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.payoutSubmission.update({
        where: { id },
        data: { status: 'APPROVED' },
      }),
      prisma.leaderboardEntry.upsert({
        where: {
          userId_month_year: {
            userId: submission.userId,
            month: submission.month,
            year: submission.year,
          },
        },
        update: {
          payout: submission.amount,
          propFirm: submission.propFirm,
          system: submission.system,
        },
        create: {
          userId: submission.userId,
          month: submission.month,
          year: submission.year,
          system: submission.system,
          propFirm: submission.propFirm,
          payout: submission.amount,
        },
      }),
    ])
  } else {
    await prisma.payoutSubmission.update({
      where: { id },
      data: { status: 'REJECTED' },
    })
  }

  revalidateTag('leaderboard')
  return NextResponse.json({ ok: true })
}
