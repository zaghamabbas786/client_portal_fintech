import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryKey } from '@tanstack/react-query'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string
  content: string
  tag: string
  amount: string | null
  imageUrl: string | null
  isPinned: boolean
  createdAt: string
  user: { id: string; fullName: string | null; email: string; role: string }
  _count: { likes: number; comments: number }
  isLiked: boolean
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: { fullName: string | null; email: string }
}

// ─── Query keys ───────────────────────────────────────────────────────────────
// Centralised so invalidation is consistent everywhere.

export const communityKeys = {
  all: ['community'] as const,
  posts: (tag: string) => ['community', 'posts', tag] as const,
  comments: (postId: string) => ['community', 'comments', postId] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchPosts(tag: string): Promise<Post[]> {
  const url = tag === 'ALL' ? '/api/community' : `/api/community?tag=${tag}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load posts')
  const data = await res.json()
  return data.posts ?? []
}

async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`/api/community/${postId}/comments`)
  if (!res.ok) throw new Error('Failed to load comments')
  const data = await res.json()
  return data.comments ?? []
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetches and caches posts for a given filter tag. */
export function usePosts(tag: string) {
  return useQuery({
    queryKey: communityKeys.posts(tag),
    queryFn: () => fetchPosts(tag),
    // Show previous filter's data while new filter loads — no flicker
    placeholderData: keepPreviousData,
  })
}

/** Fetches comments for a single post (only runs when `enabled` is true). */
export function useComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled,
  })
}

/** Creates a new post, then invalidates the cache so the feed refreshes. */
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { content: string; tag: string; amount: string | null; imageUrl?: string | null }) =>
      fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to post')
        return r.json()
      }),
    onSuccess: () => {
      // Invalidate all post lists so every open filter refreshes
      qc.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

/** Toggles a like with optimistic update — instant feedback, no spinner needed. */
export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/community/${postId}/like`, { method: 'POST' }).then((r) => {
        if (!r.ok) throw new Error('Like failed')
      }),

    // Flip the like immediately before the server responds
    onMutate: async (postId: string) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: communityKeys.all })

      // Snapshot every posts list in cache for rollback
      const snapshots = new Map<QueryKey, Post[]>()
      const allCached = qc.getQueriesData<Post[]>({ queryKey: communityKeys.all })

      for (const [key, data] of allCached) {
        if (!data) continue
        snapshots.set(key, data)
        qc.setQueryData<Post[]>(key, (old) =>
          old?.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !p.isLiked,
                  _count: {
                    ...p._count,
                    likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1,
                  },
                }
              : p,
          ),
        )
      }
      return { snapshots }
    },

    // Roll back all optimistic updates on error
    onError: (_err, _postId, context) => {
      if (!context) return
      for (const [key, data] of context.snapshots) {
        qc.setQueryData(key, data)
      }
    },
  })
}

/** Adds a comment, then updates the comment list and post count in the cache. */
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      fetch(`/api/community/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to comment')
        return r.json() as Promise<{ comment: Comment }>
      }),

    onSuccess: (data, { postId }) => {
      // Append the new comment to the existing list
      qc.setQueryData<Comment[]>(communityKeys.comments(postId), (old) => [
        ...(old ?? []),
        data.comment,
      ])
      // Bump the comment count on all post list caches
      qc.setQueriesData<Post[]>({ queryKey: communityKeys.all }, (old) =>
        old?.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } }
            : p,
        ),
      )
    },
  })
}
