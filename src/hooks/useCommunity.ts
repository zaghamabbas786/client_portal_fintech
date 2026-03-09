import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query'

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

export interface PostsPage {
  posts: Post[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: { fullName: string | null; email: string }
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['community'] as const,
  posts: (tag: string) => ['community', 'posts', tag] as const,
  comments: (postId: string) => ['community', 'comments', postId] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchPostsPage(tag: string, page: number): Promise<PostsPage> {
  const params = new URLSearchParams({ page: String(page) })
  if (tag !== 'ALL') params.set('tag', tag)
  const res = await fetch(`/api/community?${params}`)
  if (!res.ok) throw new Error('Failed to load posts')
  return res.json()
}

async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`/api/community/${postId}/comments`)
  if (!res.ok) throw new Error('Failed to load comments')
  const data = await res.json()
  return data.comments ?? []
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Infinite-scroll posts — new pages are appended as user scrolls to bottom. */
export function useInfinitePosts(tag: string) {
  return useInfiniteQuery<PostsPage, Error, InfiniteData<PostsPage>, QueryKey, number>({
    queryKey: communityKeys.posts(tag),
    queryFn: ({ pageParam }) => fetchPostsPage(tag, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}

/** Fetches comments for a single post (only runs when enabled). */
export function useComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled,
  })
}

/** Creates a new post and resets the feed back to page 1. */
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      content: string
      tag: string
      amount: string | null
      imageUrl?: string | null
    }) =>
      fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to post')
        return r.json()
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

/** Optimistic like toggle — flips instantly, rolls back on error. */
export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/community/${postId}/like`, { method: 'POST' }).then((r) => {
        if (!r.ok) throw new Error('Like failed')
      }),

    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: communityKeys.all })

      const snapshots = new Map<QueryKey, InfiniteData<PostsPage>>()
      const allCached = qc.getQueriesData<InfiniteData<PostsPage>>({
        queryKey: communityKeys.all,
      })

      for (const [key, data] of allCached) {
        if (!data) continue
        snapshots.set(key, data)
        qc.setQueryData<InfiniteData<PostsPage>>(key, {
          ...data,
          pages: data.pages.map((pg) => ({
            ...pg,
            posts: pg.posts.map((p) =>
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
          })),
        })
      }
      return { snapshots }
    },

    onError: (_err, _postId, context) => {
      if (!context) return
      for (const [key, data] of context.snapshots) {
        qc.setQueryData(key, data)
      }
    },
  })
}

/** Adds a comment and updates counts across all cached pages. */
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
      qc.setQueryData<Comment[]>(communityKeys.comments(postId), (old) => [
        ...(old ?? []),
        data.comment,
      ])
      qc.setQueriesData<InfiniteData<PostsPage>>({ queryKey: communityKeys.all }, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg,
            posts: pg.posts.map((p) =>
              p.id === postId
                ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } }
                : p,
            ),
          })),
        }
      })
    },
  })
}
