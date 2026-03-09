import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  tag: z.enum(['PAYOUT', 'AURUM_RESULTS', 'CHALLENGE_PASSED', 'GENERAL', 'QUESTION']),
  amount: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const where = tag && tag !== 'ALL' ? { tag: tag as any } : {}

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    skip: (page - 1) * limit,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: userProfile.id }, select: { id: true } },
    },
  })

  const formatted = posts.map(({ likes, amount, createdAt, updatedAt, ...rest }) => ({
    ...rest,
    amount: amount != null ? amount.toString() : null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    isLiked: likes.length > 0,
  }))

  return NextResponse.json({ posts: formatted })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }

  const { content, tag, amount, imageUrl } = parsed.data

  const post = await prisma.post.create({
    data: {
      userId: userProfile.id,
      content,
      tag,
      amount: amount ? parseFloat(amount) : null,
      imageUrl: imageUrl ?? null,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const { amount: postAmount, createdAt, updatedAt, ...postRest } = post
  return NextResponse.json({
    post: {
      ...postRest,
      amount: postAmount != null ? postAmount.toString() : null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      isLiked: false,
    },
  }, { status: 201 })
}
