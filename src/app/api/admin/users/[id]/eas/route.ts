/**
 * GET  /api/admin/users/[id]/eas  – list user's EA licenses + all available EAs
 * POST /api/admin/users/[id]/eas  – assign a new EA license
 */
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id: userId } = await params

  const [userEAs, allEAs] = await Promise.all([
    prisma.userEA.findMany({
      where: { userId },
      include: { ea: true },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.eA.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({ userEAs, allEAs })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id: userId } = await params
  const { eaId, accountNumber, broker, status } = await req.json()

  if (!eaId) {
    return NextResponse.json({ error: 'eaId is required' }, { status: 400 })
  }

  // upsert so re-assigning the same EA updates the details
  const userEA = await prisma.userEA.upsert({
    where: { userId_eaId: { userId, eaId } },
    update: {
      accountNumber: accountNumber || null,
      broker: broker || null,
      status: status ?? 'ACTIVE',
    },
    create: {
      userId,
      eaId,
      accountNumber: accountNumber || null,
      broker: broker || null,
      status: status ?? 'ACTIVE',
    },
    include: { ea: true },
  })

  // Bust the server cache so the user sees the change immediately on My EAs
  revalidateTag('user-eas')
  revalidateTag(`user-eas-${userId}`)

  return NextResponse.json({ userEA }, { status: 201 })
}
