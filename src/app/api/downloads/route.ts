import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isAurumOrAbove = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  const allowedRoles: ('STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN')[] = isAurumOrAbove
    ? ['STANDARD', 'AURUM', 'BOARDROOM']
    : ['STANDARD']

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [downloads, total] = await Promise.all([
    prisma.download.findMany({
      where: { requiredRole: { in: allowedRoles } },
      include: { ea: true },
      orderBy: [{ ea: { name: 'asc' } }, { isLatest: 'desc' }],
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.download.count({ where: { requiredRole: { in: allowedRoles } } }),
  ])

  const formatted = downloads.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    fileType: d.fileType,
    fileUrl: d.fileUrl,
    version: d.version,
    isLatest: d.isLatest,
    requiredRole: d.requiredRole,
    ea: d.ea,
  }))

  const isStandard = userProfile.role === 'STANDARD'

  return NextResponse.json({
    downloads: formatted,
    total,
    page,
    totalPages: Math.ceil(total / LIMIT),
    isStandard,
  })
}
