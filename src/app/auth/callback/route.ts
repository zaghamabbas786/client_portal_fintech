import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Referral: prefer ref from URL (survives email redirect), fallback to cookie
      const refCode = searchParams.get('ref') || cookieStore.get('ref_code')?.value
      if (refCode && data.user) {
        try {
          const { prisma } = await import('@/lib/prisma')
          const sender = await prisma.user.findFirst({
            where: { referralCode: refCode },
            select: { id: true },
          })
          if (sender) {
            // User row may not exist yet (created by getUserProfile on first page load).
            // Create it here so we can link the referral.
            let newUser = await prisma.user.findUnique({
              where: { supabaseId: data.user.id },
              select: { id: true },
            })
            if (!newUser) {
              newUser = await prisma.user.create({
                data: {
                  supabaseId: data.user.id,
                  email: data.user.email ?? '',
                  fullName: data.user.user_metadata?.full_name ?? null,
                  role: 'STANDARD',
                },
                select: { id: true },
              })
            }
            await prisma.referral.create({
              data: {
                senderId: sender.id,
                email: data.user.email ?? '',
                signedUp: true,
                convertedUserId: newUser.id,
              },
            }).catch(() => { /* ignore duplicate */ })
            cookieStore.delete('ref_code')
            revalidateTag('referrals')
          }
        } catch { /* referral tracking is non-critical */ }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
