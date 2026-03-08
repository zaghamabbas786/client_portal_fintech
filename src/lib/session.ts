import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Cached per-request Supabase auth user.
 * React.cache() deduplicates calls within the same RSC render tree,
 * so layout + page share one network round-trip instead of two.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Cached per-request user profile from Prisma.
 * Auto-creates the record if the user signed up but has no DB row yet.
 */
export const getUserProfile = cache(async () => {
  const authUser = await getAuthUser()
  if (!authUser) return null

  let profile = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  })

  if (!profile) {
    profile = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email!,
        fullName: authUser.user_metadata?.full_name ?? null,
        role: 'STANDARD',
      },
    })
  }

  return profile
})
