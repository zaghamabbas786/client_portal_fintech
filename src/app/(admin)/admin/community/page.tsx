'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Pin, PinOff, Trash2, Loader2, Search, X } from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import Pagination from '@/components/admin/Pagination'

interface PostUser {
  id: string
  fullName: string | null
  email: string
  role: string
}

interface Post {
  id: string
  content: string
  tag: string
  isPinned: boolean
  imageUrl: string | null
  amount: string | null
  createdAt: string
  user: PostUser
  _count: { likes: number; comments: number }
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  PAYOUT:           { bg: 'var(--green-s)',  color: 'var(--green)'  },
  AURUM_RESULTS:    { bg: 'var(--gold-s)',   color: 'var(--gold)'   },
  CHALLENGE_PASSED: { bg: 'var(--blue-s)',   color: 'var(--blue)'   },
  GENERAL:          { bg: 'var(--bg-3)',     color: 'var(--text-3)' },
  QUESTION:         { bg: 'var(--purple-s)', color: 'var(--purple)' },
}

const TAG_LABELS: Record<string, string> = {
  PAYOUT: 'Payout', AURUM_RESULTS: 'Aurum', CHALLENGE_PASSED: 'Challenge',
  GENERAL: 'General', QUESTION: 'Question',
}

export default function AdminCommunityPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'community', 'posts', page, search, tagFilter],
    queryFn: (): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (search) params.set('search', search)
      if (tagFilter !== 'ALL') params.set('tag', tagFilter)
      return fetch(`/api/admin/community/posts?${params}`).then((r) => r.json())
    },
  })

  const togglePin = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      fetch(`/api/admin/community/posts/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'community', 'posts'] }),
  })

  const deletePost = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/community/posts/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'community', 'posts'] })
      setConfirmDelete(null)
    },
  })

  const posts = data?.posts ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <MessageSquare size={20} style={{ color: 'var(--text-2)' }} />
          Community Moderation
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Pin important posts, remove violations, manage the feed.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search posts or authors…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', ...Object.keys(TAG_LABELS)].map((tag) => (
            <button
              key={tag}
              onClick={() => { setTagFilter(tag); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={
                tagFilter === tag
                  ? { background: 'var(--red)', color: '#fff', border: 'none' }
                  : { background: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }
              }
            >
              {tag === 'ALL' ? 'All' : TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="text-[12px] mb-4" style={{ color: 'var(--text-3)' }}>
        {total} post{total !== 1 ? 's' : ''}
        {' · '}
        {posts.filter((p) => p.isPinned).length} pinned on this page
      </div>

      {/* Posts table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 140px 80px 80px 100px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}
        >
          <span>Post</span>
          <span>Author</span>
          <span className="text-center">Likes</span>
          <span className="text-center">Tag</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading && (
          <div className="py-12 flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={20} className="animate-spin mr-2" /> Loading posts…
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>
            No posts match your filters.
          </div>
        )}

        {posts.map((post) => {
          const tagStyle = TAG_COLORS[post.tag] ?? TAG_COLORS.GENERAL
          const displayName = post.user.fullName || post.user.email.split('@')[0]

          return (
            <div
              key={post.id}
              className="grid px-5 py-4 items-center gap-3"
              style={{
                gridTemplateColumns: '1fr 140px 80px 80px 100px',
                borderBottom: '1px solid var(--border)',
                background: post.isPinned ? 'rgba(229,57,53,0.04)' : undefined,
              }}
            >
              {/* Content */}
              <div className="min-w-0">
                {post.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 mr-1"
                    style={{ background: 'var(--red-s)', color: 'var(--red)' }}>
                    <Pin size={8} /> PINNED
                  </span>
                )}
                <p className="text-[13px] leading-snug line-clamp-2" style={{ color: 'var(--text-1)' }}>
                  {post.content}
                </p>
                <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
                >
                  {getInitials(post.user.fullName || post.user.email)}
                </div>
                <span className="text-[12px] truncate" style={{ color: 'var(--text-2)' }}>
                  {displayName}
                </span>
              </div>

              {/* Likes */}
              <div className="text-center text-[13px] font-mono" style={{ color: 'var(--text-2)' }}>
                {post._count.likes}
              </div>

              {/* Tag */}
              <div className="flex justify-center">
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: tagStyle.bg, color: tagStyle.color }}
                >
                  {TAG_LABELS[post.tag] ?? post.tag}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => togglePin.mutate({ id: post.id, isPinned: !post.isPinned })}
                  disabled={togglePin.isPending}
                  title={post.isPinned ? 'Unpin post' : 'Pin post'}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: post.isPinned ? 'var(--red-s)' : 'var(--bg-3)', color: post.isPinned ? 'var(--red)' : 'var(--text-3)' }}
                >
                  {togglePin.isPending ? <Loader2 size={12} className="animate-spin" /> : post.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button
                  onClick={() => setConfirmDelete(post.id)}
                  title="Delete post"
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-[12px] p-6"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>Delete Post?</h3>
              <button onClick={() => setConfirmDelete(null)} style={{ color: 'var(--text-3)' }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-[13px] mb-6" style={{ color: 'var(--text-2)' }}>
              This will permanently delete the post and all its comments. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-[7px] text-[13px] font-semibold"
                style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost.mutate(confirmDelete)}
                disabled={deletePost.isPending}
                className="flex-1 py-2 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--red)' }}
              >
                {deletePost.isPending ? <><Loader2 size={12} className="animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
