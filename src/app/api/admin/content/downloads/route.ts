import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [downloads, eas, total] = await Promise.all([
    prisma.download.findMany({
      orderBy: { createdAt: 'desc' },
      include: { ea: true },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.eA.findMany({ orderBy: { name: 'asc' } }),
    prisma.download.count(),
  ])
  return NextResponse.json({ downloads, eas, total, page, totalPages: Math.ceil(total / LIMIT) })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await req.json()
  const { name, description, fileType, fileUrl, version, isLatest, requiredRole, eaId } = body

  if (!name || !fileType || !fileUrl || !version) {
    return NextResponse.json({ error: 'name, fileType, fileUrl, version required' }, { status: 400 })
  }

  const download = await prisma.download.create({
    data: { name, description, fileType, fileUrl, version, isLatest: isLatest ?? true, requiredRole: requiredRole ?? 'STANDARD', eaId: eaId || null },
    include: { ea: true },
  })
  revalidateTag('downloads')
  return NextResponse.json({ download }, { status: 201 })
}
