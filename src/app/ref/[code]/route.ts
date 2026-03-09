import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Referral redirect. No database calls - avoids connection pool timeouts.
 *
 * 1. Stores the referral code in a cookie (30 days).
 * 2. Redirects to /signup?ref=<code>.
 *
 * The auth callback validates the code when the user confirms signup.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const cookieStore = await cookies()
  cookieStore.set('ref_code', code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  })

  return NextResponse.redirect(
    new URL(`/signup?ref=${encodeURIComponent(code)}`, _req.url)
  )
}
