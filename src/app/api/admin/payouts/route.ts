import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const submissions = await prisma.payoutSubmission.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  })

  return NextResponse.json({ submissions })
}
