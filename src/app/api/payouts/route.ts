import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

const createSchema = z.object({
  propFirm: z.string().min(1).max(100),
  amount: z.number().positive(),
  proofUrl: z.string().url(),
  system: z.enum(['Aurum', 'Omni']).default('Aurum'),
  month: z.string().min(1),
  year: z.number().int().min(2020).max(2030),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const submissions = await prisma.payoutSubmission.findMany({
    where: { userId: userProfile.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ submissions })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.payoutSubmission.findFirst({
    where: {
      userId: userProfile.id,
      month: parsed.data.month,
      year: parsed.data.year,
      status: 'PENDING',
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'You already have a pending payout for this month. Wait for verification.' },
      { status: 409 }
    )
  }

  const submission = await prisma.payoutSubmission.create({
    data: {
      userId: userProfile.id,
      propFirm: parsed.data.propFirm,
      amount: parsed.data.amount,
      proofUrl: parsed.data.proofUrl,
      system: parsed.data.system,
      month: parsed.data.month,
      year: parsed.data.year,
    },
  })

  revalidateTag('leaderboard')
  return NextResponse.json({ submission }, { status: 201 })
}
