/**
 * POST /api/referral/track-from-session
 *
 * Creates a referral from the current session's user_metadata.ref.
 * Called by client when user lands on dashboard after signup.
 * Does NOT rely on cookies or URL params - ref is in user_metadata.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
    }

    const refCode = user.user_metadata?.ref as string | undefined
    if (!refCode || typeof refCode !== 'string') {
      return NextResponse.json({ ok: false, message: 'No referral in session' })
    }

    const sender = await prisma.user.findFirst({
      where: { referralCode: refCode },
      select: { id: true },
    })

    if (!sender) {
      return NextResponse.json({ ok: false, message: 'Invalid referral code' })
    }

    let newUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    })

    if (!newUser) {
      newUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email ?? '',
          fullName: user.user_metadata?.full_name ?? null,
          role: 'STANDARD',
        },
        select: { id: true },
      })
    }

    if (sender.id === newUser.id) {
      return NextResponse.json({ ok: false, message: 'Cannot self-refer' })
    }

    const existing = await prisma.referral.findFirst({
      where: { senderId: sender.id, convertedUserId: newUser.id },
    })

    if (!existing) {
      await prisma.referral.create({
        data: {
          senderId: sender.id,
          email: user.email ?? '',
          signedUp: true,
          convertedUserId: newUser.id,
        },
      })
    }

    revalidateTag('referrals')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[referral/track-from-session]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
