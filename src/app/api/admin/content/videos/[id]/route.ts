import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await req.json()

  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.embedUrl !== undefined && { embedUrl: body.embedUrl }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
      ...(body.requiredRole !== undefined && { requiredRole: body.requiredRole }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  })
  return NextResponse.json({ video })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
