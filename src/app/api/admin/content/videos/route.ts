import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

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

  const video = await prisma.video.create({
    data: {
      title, description, duration, embedUrl, category,
      isFeatured: isFeatured ?? false,
      thumbnail: thumbnail || null,
      requiredRole: requiredRole ?? 'STANDARD',
      sortOrder: sortOrder ?? 0,
    },
  })
  return NextResponse.json({ video }, { status: 201 })
}
