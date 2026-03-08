'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatRelativeTime, getInitials, formatCurrencyDetailed } from '@/lib/utils'
import { Heart, MessageSquare, Flag, Pin, ImagePlus, Send, Filter, ChevronDown, Loader2 } from 'lucide-react'
import type { PostTag } from '@/types'

// ─── Module-level cache (stale-while-revalidate) ─────────────────────────────
// Lives outside the component so it survives navigation away and back.
// Posts are shown instantly from cache; a background refresh keeps them fresh.
const postsCache = new Map<string, { posts: Post[]; ts: number }>()
const STALE_MS = 3 * 60 * 1000 // show cached data up to 3 min old without a loading spinner

const POST_TAGS = [
  { value: 'PAYOUT', label: 'Payout Received', color: 'var(--green)', bg: 'var(--green-s)' },
  { value: 'AURUM_RESULTS', label: 'Aurum Results', color: 'var(--gold)', bg: 'var(--gold-s)' },
  { value: 'CHALLENGE_PASSED', label: 'Challenge Passed', color: 'var(--blue)', bg: 'var(--blue-s)' },
  { value: 'GENERAL', label: 'General Discussion', color: 'var(--text-2)', bg: 'var(--bg-3)' },
  { value: 'QUESTION', label: 'Question', color: 'var(--purple)', bg: 'var(--purple-s)' },
] as const

interface Post {
  id: string
  content: string
  tag: PostTag
  amount: string | null
  imageUrl: string | null
  isPinned: boolean
  createdAt: string
  user: { id: string; fullName: string | null; email: string; role: string }
  _count: { likes: number; comments: number }
  isLiked: boolean
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { fullName: string | null; email: string }
}

const tagMeta = {
  PAYOUT: { label: 'PAYOUT', color: 'var(--green)', bg: 'var(--green-s)', border: 'var(--green)' },
  AURUM_RESULTS: { label: 'AURUM', color: 'var(--gold)', bg: 'var(--gold-s)', border: 'var(--gold)' },
  CHALLENGE_PASSED: { label: 'CHALLENGE', color: 'var(--blue)', bg: 'var(--blue-s)', border: 'transparent' },
  GENERAL: { label: 'GENERAL', color: 'var(--text-2)', bg: 'var(--bg-3)', border: 'transparent' },
  QUESTION: { label: 'QUESTION', color: 'var(--purple)', bg: 'var(--purple-s)', border: 'transparent' },
}

const avatarGradients = [
  'linear-gradient(135deg,#D4AF37,#8B6914)',
  'linear-gradient(135deg,#00C853,#009624)',
  'linear-gradient(135deg,#42A5F5,#1565C0)',
  'linear-gradient(135deg,#E53935,#b71c1c)',
  'linear-gradient(135deg,#AB47BC,#6a1b9a)',
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(() => postsCache.get('ALL')?.posts ?? [])
  const [loading, setLoading] = useState(() => !postsCache.has('ALL'))
  const [refreshing, setRefreshing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<PostTag>('GENERAL')
  const [amount, setAmount] = useState('')
  const [filterTag, setFilterTag] = useState<string>('ALL')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())
  const [commentingIds, setCommentingIds] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const fetchPosts = useCallback(async (tag: string, isBackground = false) => {
    // Cancel any in-flight request for this same slot
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const cached = postsCache.get(tag)
    const isFresh = cached && Date.now() - cached.ts < STALE_MS

    if (cached) {
      // Always show cached data immediately — no blank screen
      setPosts(cached.posts)
      setLoading(false)
    }

    // Skip network call if cache is still fresh and this isn't a forced refresh
    if (isFresh && !isBackground) return

    if (!cached) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await fetch(
        `/api/community${tag !== 'ALL' ? `?tag=${tag}` : ''}`,
        { signal: abortRef.current.signal },
      )
      if (res.ok) {
        const data = await res.json()
        const fresh = data.posts ?? []
        postsCache.set(tag, { posts: fresh, ts: Date.now() })
        setPosts(fresh)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(filterTag)
  }, [fetchPosts, filterTag])

  async function handlePost() {
    if (!content.trim()) return
    setPosting(true)
    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim(),
        tag: selectedTag,
        amount: (selectedTag === 'PAYOUT' || selectedTag === 'AURUM_RESULTS') && amount ? amount : null,
      }),
    })
    if (res.ok) {
      setContent('')
      setAmount('')
      // Bust the cache so the feed reloads with the new post
      postsCache.delete('ALL')
      postsCache.delete(filterTag)
      await fetchPosts(filterTag)
    }
    setPosting(false)
  }

  async function handleLike(postId: string) {
    if (likingIds.has(postId)) return
    setLikingIds((prev) => new Set(prev).add(postId))
    const res = await fetch(`/api/community/${postId}/like`, { method: 'POST' })
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, _count: { ...p._count, likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1 } }
            : p
        )
      )
    }
    setLikingIds((prev) => { const s = new Set(prev); s.delete(postId); return s })
  }

  async function toggleComments(postId: string) {
    const next = new Set(expandedComments)
    if (next.has(postId)) {
      next.delete(postId)
    } else {
      next.add(postId)
      if (!comments[postId]) {
        const res = await fetch(`/api/community/${postId}/comments`)
        if (res.ok) {
          const data = await res.json()
          setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }))
        }
      }
    }
    setExpandedComments(next)
  }

  async function handleComment(postId: string) {
    const text = commentInput[postId]?.trim()
    if (!text || commentingIds.has(postId)) return
    setCommentingIds((prev) => new Set(prev).add(postId))
    const res = await fetch(`/api/community/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }))
      setCommentInput((prev) => ({ ...prev, [postId]: '' }))
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p))
    }
    setCommentingIds((prev) => { const s = new Set(prev); s.delete(postId); return s })
  }

  const showAmount = selectedTag === 'PAYOUT' || selectedTag === 'AURUM_RESULTS'
  const selectedTagMeta = POST_TAGS.find((t) => t.value === selectedTag)!
  const filterLabel = filterTag === 'ALL' ? 'All Posts' : tagMeta[filterTag as keyof typeof tagMeta]?.label ?? filterTag

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
            Community
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Share results, ask questions, connect with traders.
          </p>
        </div>
        {/* Subtle background-refresh indicator */}
        {refreshing && (
          <div className="flex items-center gap-1.5 text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={11} className="animate-spin" />
            Refreshing…
          </div>
        )}
      </div>

      {/* Create Post */}
      <div
        className="rounded-[10px] p-5 mb-5"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your results or ask a question..."
          rows={4}
          className="w-full bg-transparent text-[13px] outline-none resize-none mb-3 rounded-lg px-1 py-1 transition-colors"
          style={{
            color: 'var(--text-1)',
            borderBottom: '1px solid var(--border)',
          }}
          onFocus={(e) => (e.target.style.borderBottomColor = 'var(--red)')}
          onBlur={(e) => (e.target.style.borderBottomColor = 'var(--border)')}
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tag selector */}
          <div className="relative">
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: selectedTagMeta.color }}
              />
              {selectedTagMeta.label}
              <ChevronDown size={12} />
            </button>
            {tagDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-48 rounded-lg py-1 z-20"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}
              >
                {POST_TAGS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setSelectedTag(t.value as PostTag); setTagDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 hover:bg-[var(--bg-hover)] transition-colors"
                    style={{ color: selectedTag === t.value ? t.color : 'var(--text-2)' }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount input (conditional) */}
          {showAmount && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Payout amount ($)"
              className="px-3 py-1.5 rounded-lg text-[12px] outline-none w-36"
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
              }}
            />
          )}

          <button
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] transition-all"
            style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
          >
            <ImagePlus size={13} />
          </button>

          <button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="ml-auto flex items-center gap-2 px-4 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all"
            style={{
              background: posting || !content.trim() ? '#7a1a18' : 'var(--red)',
              opacity: !content.trim() ? 0.5 : 1,
            }}
          >
            {posting
              ? <><Loader2 size={12} className="animate-spin" /> Posting...</>
              : <><Send size={12} /> Post</>
            }
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} style={{ color: 'var(--text-3)' }} />
        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
            }}
          >
            {filterLabel} <ChevronDown size={12} />
          </button>
          {filterDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-48 rounded-lg py-1 z-20"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => { setFilterTag('ALL'); setFilterDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: filterTag === 'ALL' ? 'var(--red)' : 'var(--text-2)' }}
              >
                All Posts
              </button>
              {POST_TAGS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setFilterTag(t.value); setFilterDropdownOpen(false) }}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ color: filterTag === t.value ? t.color : 'var(--text-2)' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-3)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--red)' }} />
          <p className="text-[13px]">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
          <div className="text-2xl mb-2">💬</div>
          <p>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => {
            const meta = tagMeta[post.tag] ?? tagMeta.GENERAL
            const isAurum = post.tag === 'AURUM_RESULTS'
            const isPayout = post.tag === 'PAYOUT'
            const postUser = post.user.fullName || post.user.email.split('@')[0]
            const isExpanded = expandedComments.has(post.id)
            const postComments = comments[post.id] ?? []

            return (
              <div
                key={post.id}
                className="rounded-[10px] p-[18px]"
                style={{
                  background: 'var(--bg-2)',
                  border: `1px solid var(--border)`,
                  borderLeft: isAurum
                    ? '3px solid var(--gold)'
                    : isPayout
                    ? '3px solid var(--green)'
                    : '1px solid var(--border)',
                }}
              >
                {/* Post header */}
                <div className="flex items-center gap-2 mb-3">
                  {post.isPinned && (
                    <Pin size={12} className="flex-shrink-0" style={{ color: 'var(--red)' }} />
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: avatarGradients[i % avatarGradients.length] }}
                  >
                    {getInitials(postUser)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
                        {postUser}
                      </span>
                      {post.user.role === 'BOARDROOM' && (
                        <span
                          className="text-[9px] font-bold px-[6px] py-[1px] rounded-full"
                          style={{ background: 'var(--gold-s)', color: 'var(--gold)' }}
                        >
                          BOARDROOM
                        </span>
                      )}
                      {post.user.role === 'ADMIN' && (
                        <span
                          className="text-[9px] font-bold px-[6px] py-[1px] rounded-full"
                          style={{ background: 'var(--red-s)', color: 'var(--red)' }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {formatRelativeTime(post.createdAt)}
                    </div>
                  </div>
                  <span
                    className="ml-auto text-[10px] font-bold px-[9px] py-[3px] rounded-full"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Post body */}
                <p className="text-[14px] leading-relaxed mb-2" style={{ color: 'var(--text-1)' }}>
                  {post.content}
                </p>

                {post.amount && (
                  <div className="font-mono text-[26px] font-bold my-2" style={{ color: 'var(--green)' }}>
                    {formatCurrencyDetailed(post.amount)}
                  </div>
                )}

                {/* Post footer */}
                <div className="flex items-center gap-4 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={likingIds.has(post.id)}
                    className="flex items-center gap-1.5 text-[12px] transition-all"
                    style={{
                      color: post.isLiked ? 'var(--red)' : 'var(--text-3)',
                      opacity: likingIds.has(post.id) ? 0.5 : 1,
                    }}
                  >
                    {likingIds.has(post.id)
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
                    }
                    {post._count.likes}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-80"
                    style={{ color: isExpanded ? 'var(--blue)' : 'var(--text-3)' }}
                  >
                    <MessageSquare size={14} />
                    {post._count.comments}
                  </button>
                  <button
                    className="ml-auto text-[11px] flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <Flag size={12} />
                    Report
                  </button>
                </div>

                {/* Comments section */}
                {isExpanded && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    {postComments.map((c) => (
                      <div key={c.id} className="flex gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(135deg,#9090a8,#606078)' }}
                        >
                          {getInitials(c.user.fullName || c.user.email)}
                        </div>
                        <div
                          className="flex-1 rounded-lg px-3 py-2"
                          style={{ background: 'var(--bg-1)' }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-1)' }}>
                              {c.user.fullName || c.user.email.split('@')[0]}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>{c.content}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={commentInput[post.id] ?? ''}
                        onChange={(e) => setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
                        style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={commentingIds.has(post.id)}
                        className="px-3 py-2 rounded-lg transition-all flex items-center justify-center"
                        style={{
                          background: 'var(--red)',
                          color: '#fff',
                          opacity: commentingIds.has(post.id) ? 0.7 : 1,
                          minWidth: '38px',
                        }}
                      >
                        {commentingIds.has(post.id)
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Send size={13} />
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
