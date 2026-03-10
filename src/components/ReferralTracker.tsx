/**
 * Server component: fallback referral tracking when auth callback misses it
 * (e.g. cookie lost on redirect, callback DB timeout). Runs on portal load.
 */
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
  userEmail: string
  refFromMetadata?: string | null
}

export default async function ReferralTracker({ userId, userEmail, refFromMetadata }: Props) {
  const cookieStore = await cookies()
  const refCode = cookieStore.get('ref_code')?.value || refFromMetadata || undefined

  if (!refCode) return null

  try {
    const sender = await prisma.user.findFirst({
      where: { referralCode: refCode },
      select: { id: true },
    })
    if (sender && sender.id !== userId) {
      const existing = await prisma.referral.findFirst({
        where: { senderId: sender.id, convertedUserId: userId },
      })
      if (!existing) {
        await prisma.referral.create({
          data: {
            senderId: sender.id,
            email: userEmail,
            signedUp: true,
            convertedUserId: userId,
          },
        })
      }
      cookieStore.delete('ref_code')
      revalidateTag('referrals')
    }
  } catch (err) {
    console.error('[ReferralTracker]', err)
  }

  return null
}
