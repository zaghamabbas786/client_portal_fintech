import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['PENDING', 'REVIEWED', 'APPROVED', 'DECLINED'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await req.json()
  const status = body.status

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const request = await prisma.eARequest.update({
    where: { id },
    data: { status },
  })
  revalidateTag('ea-requests')
  revalidateTag(`user-ea-requests-${request.userId}`)
  return NextResponse.json({ request })
}
