import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  if (!(prisma as { eARequest?: unknown }).eARequest) {
    return NextResponse.json({ error: 'EARequest model not available. Run "npx prisma generate" and restart the server.' }, { status: 503 })
  }
  const requests = await prisma.eARequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
    },
  })

  return NextResponse.json({ requests })
}
