/**
 * PATCH  /api/admin/users/[id]/eas/[eaId]  – update account number, broker, status
 * DELETE /api/admin/users/[id]/eas/[eaId]  – revoke license
 */
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eaId: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id: userId, eaId } = await params
  const { accountNumber, broker, status } = await req.json()

  const userEA = await prisma.userEA.update({
    where: { userId_eaId: { userId, eaId } },
    data: {
      ...(accountNumber !== undefined && { accountNumber: accountNumber || null }),
      ...(broker !== undefined && { broker: broker || null }),
      ...(status !== undefined && { status }),
    },
    include: { ea: true },
  })

  revalidateTag('user-eas')
  revalidateTag(`user-eas-${userId}`)

  return NextResponse.json({ userEA })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eaId: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id: userId, eaId } = await params

  await prisma.userEA.delete({
    where: { userId_eaId: { userId, eaId } },
  })

  revalidateTag('user-eas')
  revalidateTag(`user-eas-${userId}`)

  return NextResponse.json({ ok: true })
}
