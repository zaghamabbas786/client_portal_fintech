import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const posts = await prisma.post.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const formatted = posts.map(({ amount, createdAt, updatedAt, ...rest }) => ({
    ...rest,
    amount: amount != null ? amount.toString() : null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }))

  return NextResponse.json({ posts: formatted })
}
