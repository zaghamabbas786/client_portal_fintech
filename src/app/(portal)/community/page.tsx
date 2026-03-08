'use client'

import { useState } from 'react'
import { formatRelativeTime, getInitials, formatCurrencyDetailed } from '@/lib/utils'
import { Heart, MessageSquare, Flag, Pin, ImagePlus, Send, Filter, ChevronDown, Loader2 } from 'lucide-react'
import type { PostTag } from '@/types'
import {
  usePosts,
  useComments,
  useCreatePost,
  useToggleLike,
  useAddComment,
} from '@/hooks/useCommunity'

const POST_TAGS = [
  { value: 'PAYOUT', label: 'Payout Received', color: 'var(--green)', bg: 'var(--green-s)' },
  { value: 'AURUM_RESULTS', label: 'Aurum Results', color: 'var(--gold)', bg: 'var(--gold-s)' },
  { value: 'CHALLENGE_PASSED', label: 'Challenge Passed', color: 'var(--blue)', bg: 'var(--blue-s)' },
  { value: 'GENERAL', label: 'General Discussion', color: 'var(--text-2)', bg: 'var(--bg-3)' },
  { value: 'QUESTION', label: 'Question', color: 'var(--purple)', bg: 'var(--purple-s)' },
] as const

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

// ─── Comment section for a single post ───────────────────────────────────────

function CommentsSection({ postId }: { postId: string }) {
  const [input, setInput] = useState('')
  const { data: comments = [], isLoading } = useComments(postId, true)
  const addComment = useAddComment()

  function submit() {
    const text = input.trim()
    if (!text || addComment.isPending) return
    addComment.mutate({ postId, content: text }, { onSuccess: () => setInput('') })
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-3)' }}>
          <Loader2 size={12} className="animate-spin" />
          <span className="text-[12px]">Loading comments…</span>
        </div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
              style={{ background: 'linear-gradient(135deg,#9090a8,#606078)' }}
            >
              {getInitials(c.user.fullName || c.user.email)}
            </div>
            <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'var(--bg-1)' }}>
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
        ))
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg px-3 py-2 text-[12px] outline-none"
          style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        />
        <button
          onClick={submit}
          disabled={addComment.isPending}
          className="px-3 py-2 rounded-lg transition-all flex items-center justify-center"
          style={{ background: 'var(--red)', color: '#fff', opacity: addComment.isPending ? 0.7 : 1, minWidth: '38px' }}
        >
          {addComment.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [filterTag, setFilterTag] = useState<string>('ALL')
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<PostTag>('GENERAL')
  const [amount, setAmount] = useState('')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const { data: posts = [], isLoading, isFetching } = usePosts(filterTag)
  const createPost = useCreatePost()
  const toggleLike = useToggleLike()

  const showAmount = selectedTag === 'PAYOUT' || selectedTag === 'AURUM_RESULTS'
  const selectedTagMeta = POST_TAGS.find((t) => t.value === selectedTag)!
  const filterLabel = filterTag === 'ALL' ? 'All Posts' : tagMeta[filterTag as keyof typeof tagMeta]?.label ?? filterTag

  function handlePost() {
    if (!content.trim() || createPost.isPending) return
    createPost.mutate(
      {
        content: content.trim(),
        tag: selectedTag,
        amount: showAmount && amount ? amount : null,
      },
      {
        onSuccess: () => {
          setContent('')
          setAmount('')
        },
      },
    )
  }

  function toggleComments(postId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      next.has(postId) ? next.delete(postId) : next.add(postId)
      return next
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
            Community
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Share results, ask questions, connect with traders.
          </p>
        </div>
        {/* Background-refresh indicator — only shows when re-fetching with data already visible */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={11} className="animate-spin" />
            Refreshing…
          </div>
        )}
      </div>

      {/* Create Post */}
      <div className="rounded-[10px] p-5 mb-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your results or ask a question..."
          rows={4}
          className="w-full bg-transparent text-[13px] outline-none resize-none mb-3 rounded-lg px-1 py-1 transition-colors"
          style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border)' }}
          onFocus={(e) => (e.target.style.borderBottomColor = 'var(--red)')}
          onBlur={(e) => (e.target.style.borderBottomColor = 'var(--border)')}
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tag selector */}
          <div className="relative">
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: selectedTagMeta.color }} />
              {selectedTagMeta.label}
              <ChevronDown size={12} />
            </button>
            {tagDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-lg py-1 z-20" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
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

          {showAmount && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Payout amount ($)"
              className="px-3 py-1.5 rounded-lg text-[12px] outline-none w-36"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
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
            disabled={createPost.isPending || !content.trim()}
            className="ml-auto flex items-center gap-2 px-4 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all"
            style={{ background: createPost.isPending || !content.trim() ? '#7a1a18' : 'var(--red)', opacity: !content.trim() ? 0.5 : 1 }}
          >
            {createPost.isPending
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
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            {filterLabel} <ChevronDown size={12} />
          </button>
          {filterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg py-1 z-20" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
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
      {isLoading ? (
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
            const meta = tagMeta[post.tag as keyof typeof tagMeta] ?? tagMeta.GENERAL
            const isAurum = post.tag === 'AURUM_RESULTS'
            const isPayout = post.tag === 'PAYOUT'
            const postUser = post.user.fullName || post.user.email.split('@')[0]
            const isExpanded = expandedComments.has(post.id)

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
                  {post.isPinned && <Pin size={12} className="flex-shrink-0" style={{ color: 'var(--red)' }} />}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: avatarGradients[i % avatarGradients.length] }}
                  >
                    {getInitials(postUser)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{postUser}</span>
                      {post.user.role === 'BOARDROOM' && (
                        <span className="text-[9px] font-bold px-[6px] py-[1px] rounded-full" style={{ background: 'var(--gold-s)', color: 'var(--gold)' }}>BOARDROOM</span>
                      )}
                      {post.user.role === 'ADMIN' && (
                        <span className="text-[9px] font-bold px-[6px] py-[1px] rounded-full" style={{ background: 'var(--red-s)', color: 'var(--red)' }}>ADMIN</span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{formatRelativeTime(post.createdAt)}</div>
                  </div>
                  <span
                    className="ml-auto text-[10px] font-bold px-[9px] py-[3px] rounded-full"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Post body */}
                <p className="text-[14px] leading-relaxed mb-2" style={{ color: 'var(--text-1)' }}>{post.content}</p>
                {post.amount && (
                  <div className="font-mono text-[26px] font-bold my-2" style={{ color: 'var(--green)' }}>
                    {formatCurrencyDetailed(post.amount)}
                  </div>
                )}

                {/* Post footer */}
                <div className="flex items-center gap-4 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button
                    onClick={() => toggleLike.mutate(post.id)}
                    className="flex items-center gap-1.5 text-[12px] transition-all"
                    style={{ color: post.isLiked ? 'var(--red)' : 'var(--text-3)' }}
                  >
                    {/* Optimistic update means no spinner needed — toggle is instant */}
                    <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
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
                    <Flag size={12} /> Report
                  </button>
                </div>

                {isExpanded && <CommentsSection postId={post.id} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
