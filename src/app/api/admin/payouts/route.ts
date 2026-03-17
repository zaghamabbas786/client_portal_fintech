import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [submissions, total] = await Promise.all([
    prisma.payoutSubmission.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.payoutSubmission.count({ where: { status: 'PENDING' } }),
  ])

  return NextResponse.json({ submissions, total, page, totalPages: Math.ceil(total / LIMIT) })
}
