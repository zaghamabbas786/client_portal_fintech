import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { fullName: true, email: true } } },
  })

  const formatted = comments.map(({ createdAt, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
  }))

  return NextResponse.json({ comments: formatted })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { postId, userId: userProfile.id, content: content.trim() },
    include: { user: { select: { fullName: true, email: true } } },
  })

  const { createdAt, ...commentRest } = comment
  return NextResponse.json({
    comment: { ...commentRest, createdAt: createdAt.toISOString() },
  }, { status: 201 })
}
