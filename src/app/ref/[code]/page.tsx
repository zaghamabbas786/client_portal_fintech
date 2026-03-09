import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

interface Props {
  params: Promise<{ code: string }>
}

/**
 * Referral landing page. No database calls - avoids connection pool timeouts.
 *
 * 1. Stores the referral code in a cookie (30 days).
 * 2. Redirects to /signup?ref=<code>.
 *
 * The auth callback validates the code when the user confirms signup.
 */
export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params

  const cookieStore = await cookies()
  cookieStore.set('ref_code', code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  })

  redirect(`/signup?ref=${encodeURIComponent(code)}`)
}
