import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ code: string }>
}

/**
 * Referral landing page.
 *
 * 1. Stores the referral code in a cookie (30 days).
 * 2. Marks the referral row signedUp=true if the sender exists.
 * 3. Redirects to /signup?ref=<code>.
 *
 * The signup flow should call /api/referral/convert once the new user
 * confirms their account to mark isConverted=true.
 */
export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params

  // Look up whether this code belongs to a real user
  const sender = await prisma.user.findFirst({
    where: { referralCode: code },
    select: { id: true },
  })

  if (sender) {
    // Persist the referral code in a cookie so signup can pick it up
    const cookieStore = await cookies()
    cookieStore.set('ref_code', code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  redirect(`/signup?ref=${encodeURIComponent(code)}`)
}
