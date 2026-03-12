import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { provisionAccount, getProvisionedAccount } from '@/lib/metaapi'
import { z } from 'zod'

const addSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  server: z.string().min(1),
  platform: z.enum(['mt4', 'mt5']),
  name: z.string().min(1),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const hasAccess = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  if (!hasAccess) return NextResponse.json({ error: 'Portfolio access required' }, { status: 403 })

  const accounts = await prisma.mTAccount.findMany({
    where: { userId: userProfile.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const hasAccess = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  if (!hasAccess) return NextResponse.json({ error: 'Portfolio access required' }, { status: 403 })

  if (!process.env.METAAPI_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MetaApi not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const result = await provisionAccount(parsed.data)
    const metaApiId = result.id

    const provisioned = await getProvisionedAccount(metaApiId)
    const region = provisioned.region ?? 'london'

    const existing = await prisma.mTAccount.findUnique({
      where: { metaApiAccountId: metaApiId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Account already connected' }, { status: 409 })
    }

    const account = await prisma.mTAccount.create({
      data: {
        userId: userProfile.id,
        metaApiAccountId: metaApiId,
        login: parsed.data.login,
        server: parsed.data.server,
        platform: parsed.data.platform,
        name: parsed.data.name,
        region,
      },
    })
    return NextResponse.json({ account }, { status: 201 })
  } catch (err) {
    console.error('MetaApi provision error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to connect account'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
