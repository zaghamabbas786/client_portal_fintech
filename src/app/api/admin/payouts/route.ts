import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const ok = await isAdmin()
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const submissions = await prisma.payoutSubmission.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  })

  return NextResponse.json({ submissions })
}
