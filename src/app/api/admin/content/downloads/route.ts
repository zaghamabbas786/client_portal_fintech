import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const [downloads, eas] = await Promise.all([
    prisma.download.findMany({ orderBy: { createdAt: 'desc' }, include: { ea: true } }),
    prisma.eA.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ downloads, eas })
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
