/**
 * POST /api/referral/track
 *
 * Called from the auth callback (or signup success) to mark a referral as
 * signedUp=true for the new user. Reads the ref_code cookie set by /ref/[code].
 *
 * Body: { newUserId: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refCode = cookieStore.get('ref_code')?.value

    if (!refCode) {
      return NextResponse.json({ ok: false, message: 'No referral code' })
    }

    const { newUserId } = await req.json()
    if (!newUserId) {
      return NextResponse.json({ error: 'newUserId required' }, { status: 400 })
    }

    // Find the sender by their referral code
    const sender = await prisma.user.findFirst({
      where: { referralCode: refCode },
      select: { id: true },
    })

    if (!sender) {
      cookieStore.delete('ref_code')
      return NextResponse.json({ ok: false, message: 'Invalid referral code' })
    }

    // Upsert a Referral row — signedUp = true, convertedUserId set
    await prisma.referral.upsert({
      where: {
        // Use a unique combination; since there's no unique constraint on senderId+email
        // we use id by finding existing first
        id: (
          await prisma.referral.findFirst({
            where: { senderId: sender.id, convertedUserId: newUserId },
            select: { id: true },
          })
        )?.id ?? 'new',
      },
      update: { signedUp: true, convertedUserId: newUserId },
      create: {
        senderId: sender.id,
        email: '',
        signedUp: true,
        isConverted: false,
        convertedUserId: newUserId,
      },
    })

    // Clear the cookie after use
    cookieStore.delete('ref_code')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[referral/track]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
