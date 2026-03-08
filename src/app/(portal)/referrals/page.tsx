import { Metadata } from 'next'
import { getUserProfile } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import ReferralClient from './ReferralClient'

export const metadata: Metadata = { title: 'Referrals' }

export default async function ReferralsPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const isBoardroom = userProfile.role === 'BOARDROOM' || userProfile.role === 'ADMIN'
  const commissionRate = isBoardroom ? 30 : 15

  const referrals = await prisma.referral.findMany({
    where: { senderId: userProfile.id },
  })

  const totalSent = referrals.length
  const signedUp = referrals.filter((r) => r.signedUp).length
  const converted = referrals.filter((r) => r.isConverted).length

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eoscapitaltech.com'
  const referralLink = `${baseUrl}/ref/${userProfile.referralCode}`

  return (
    <ReferralClient
      commissionRate={commissionRate}
      isBoardroom={isBoardroom}
      referralLink={referralLink}
      stats={{ totalSent, signedUp, converted }}
    />
  )
}
