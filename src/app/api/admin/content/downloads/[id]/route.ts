import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await req.json()

  const download = await prisma.download.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
      ...(body.version !== undefined && { version: body.version }),
      ...(body.isLatest !== undefined && { isLatest: body.isLatest }),
      ...(body.requiredRole !== undefined && { requiredRole: body.requiredRole }),
      ...(body.eaId !== undefined && { eaId: body.eaId || null }),
    },
    include: { ea: true },
  })
  return NextResponse.json({ download })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  await prisma.download.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
