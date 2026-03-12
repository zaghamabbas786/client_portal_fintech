import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { deleteProvisionedAccount } from '@/lib/metaapi'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const hasAccess = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  if (!hasAccess) return NextResponse.json({ error: 'Portfolio access required' }, { status: 403 })

  const { id } = await params
  const account = await prisma.mTAccount.findFirst({
    where: { id, userId: userProfile.id },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  try {
    await deleteProvisionedAccount(account.metaApiAccountId)
  } catch (err) {
    console.error('MetaApi delete error:', err)
  }
  await prisma.mTAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
