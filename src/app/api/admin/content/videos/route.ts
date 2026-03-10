import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

/** Convert YouTube watch/short URLs to embed format */
function toEmbedUrl(url: string): string {
  const trimmed = url.trim()
  // youtube.com/watch?v=VIDEO_ID or youtube.com/v/VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  // Already embed format
  return trimmed
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const videos = await prisma.video.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ videos })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await req.json()
  const { title, description, duration, embedUrl, category, isFeatured, thumbnail, requiredRole, sortOrder } = body

  if (!title || !embedUrl || !category) {
    return NextResponse.json({ error: 'title, embedUrl, category required' }, { status: 400 })
  }

  const normalizedEmbedUrl = toEmbedUrl(embedUrl)

  const video = await prisma.video.create({
    data: {
      title, description, duration, embedUrl: normalizedEmbedUrl, category,
      isFeatured: isFeatured ?? false,
      thumbnail: thumbnail || null,
      requiredRole: requiredRole ?? 'STANDARD',
      sortOrder: sortOrder ?? 0,
    },
  })
  revalidateTag('videos')
  return NextResponse.json({ video }, { status: 201 })
}
