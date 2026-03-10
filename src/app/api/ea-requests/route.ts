import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  eaName: z.string().max(100).optional().nullable(),
  message: z.string().min(1).max(2000),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!(prisma as { eARequest?: unknown }).eARequest) {
    return NextResponse.json({ requests: [] })
  }
  const requests = await prisma.eARequest.findMany({
    where: { userId: userProfile.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (!(prisma as { eARequest?: unknown }).eARequest) {
      return NextResponse.json(
        { error: 'EARequest model not available. Stop the dev server, run "npx prisma generate", then restart.' },
        { status: 503 },
      )
    }
    const eaRequest = await prisma.eARequest.create({
      data: {
        userId: userProfile.id,
        eaName: parsed.data.eaName || null,
        message: parsed.data.message,
      },
    })
    revalidateTag('ea-requests')
    revalidateTag(`user-ea-requests-${userProfile.id}`)

    return NextResponse.json({ request: eaRequest }, { status: 201 })
  } catch (err) {
    console.error('EA request error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create request' },
      { status: 500 },
    )
  }
}
