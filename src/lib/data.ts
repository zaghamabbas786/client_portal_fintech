/**
 * Cached data-access layer using Next.js unstable_cache.
 *
 * Why two layers?
 *  1. staleTimes (next.config) → browser Router Cache: navigating back is instant.
 *  2. unstable_cache here      → server cache: even fresh renders skip the DB.
 *
 * Cache keys include any arguments that change the result (userId, month, role).
 * Tags allow targeted revalidation (e.g. revalidateTag('community') after a new post).
 */

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// ─── Shared / public data (same for every user) ───────────────────────────────

/** All EAs – changes rarely, cache for 10 min. */
export const getCachedEAs = unstable_cache(
  async () => prisma.eA.findMany({ orderBy: { name: 'asc' } }),
  ['eas'],
  { revalidate: 600, tags: ['eas'] },
)

/** Downloads list – depends on role, cache per role for 5 min. */
export const getCachedDownloads = unstable_cache(
  async (allowedRoles: string[]) =>
    prisma.download.findMany({
      where: { requiredRole: { in: allowedRoles as ('STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN')[] } },
      include: { ea: true },
      orderBy: [{ ea: { name: 'asc' } }, { isLatest: 'desc' }],
    }),
  ['downloads'],
  { revalidate: 300, tags: ['downloads'] },
)

/** Education videos – depends on role, cache per role for 5 min. */
export const getCachedVideos = unstable_cache(
  async (requiredRole: string) =>
    prisma.video.findMany({
      where: { requiredRole: requiredRole as 'STANDARD' | 'AURUM' | 'BOARDROOM' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    }),
  ['videos'],
  { revalidate: 300, tags: ['videos'] },
)

/** All videos regardless of role (admin / education page) */
export const getCachedAllVideos = unstable_cache(
  async () =>
    prisma.video.findMany({
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    }),
  ['videos-all'],
  { revalidate: 300, tags: ['videos'] },
)

/** Leaderboard for a given month/year – cache for 2 min (updates often). */
export const getCachedLeaderboard = unstable_cache(
  async (month: string, year: number) =>
    prisma.leaderboardEntry.findMany({
      where: { month, year },
      orderBy: { payout: 'desc' },
      take: 20,
      include: { user: { select: { id: true, fullName: true, role: true } } },
    }),
  ['leaderboard'],
  { revalidate: 120, tags: ['leaderboard'] },
)

/** Community highlights (latest 4 posts for dashboard). */
export const getCachedCommunityHighlights = unstable_cache(
  async () =>
    prisma.post.findMany({
      take: 4,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ['community-highlights'],
  { revalidate: 60, tags: ['community'] },
)

// ─── User-specific data (keyed by userId) ─────────────────────────────────────

/** EAs assigned to a user. Cache key includes userId so each user gets their own entry. */
export const getCachedUserEAs = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.userEA.findMany({
        where: { userId },
        include: { ea: true },
      }),
    [`user-eas-${userId}`],
    { revalidate: 30, tags: ['user-eas', `user-eas-${userId}`] },
  )()

/** Latest support tickets for a user. */
export const getCachedUserTickets = unstable_cache(
  async (userId: string, take = 5) =>
    prisma.supportTicket.findMany({
      where: { userId },
      take,
      orderBy: { createdAt: 'desc' },
    }),
  ['user-tickets'],
  { revalidate: 60, tags: ['support'] },
)

/** Referrals sent by a user. */
export const getCachedReferrals = unstable_cache(
  async (userId: string) =>
    prisma.referral.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
    }),
  ['referrals'],
  { revalidate: 120, tags: ['referrals'] },
)

/** Standard downloads for the dashboard preview (4 items). */
export const getCachedDashboardDownloads = unstable_cache(
  async () =>
    prisma.download.findMany({
      where: { requiredRole: 'STANDARD', isLatest: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
  ['dashboard-downloads'],
  { revalidate: 300, tags: ['downloads'] },
)

/** Standard videos for the dashboard preview (4 items). */
export const getCachedDashboardVideos = unstable_cache(
  async () =>
    prisma.video.findMany({
      where: { requiredRole: 'STANDARD' },
      take: 4,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    }),
  ['dashboard-videos'],
  { revalidate: 300, tags: ['videos'] },
)
