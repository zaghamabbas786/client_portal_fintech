import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

/** Convert YouTube watch/short URLs to embed format */
function toEmbedUrl(url: string): string {
  const trimmed = url.trim()
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  return trimmed
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.duration !== undefined) data.duration = body.duration
  if (body.embedUrl !== undefined) data.embedUrl = toEmbedUrl(body.embedUrl)
  if (body.category !== undefined) data.category = body.category
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
  if (body.requiredRole !== undefined) data.requiredRole = body.requiredRole
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder

  const video = await prisma.video.update({
    where: { id },
    data: data as Parameters<typeof prisma.video.update>[0]['data'],
  })
  revalidateTag('videos')
  return NextResponse.json({ video })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  await prisma.video.delete({ where: { id } })
  revalidateTag('videos')
  return NextResponse.json({ ok: true })
}
