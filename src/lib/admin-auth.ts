/**
 * Shared helper for admin API routes.
 * Returns the admin user profile or throws a 403 NextResponse.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const profile = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!profile || profile.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { admin: profile }
}
