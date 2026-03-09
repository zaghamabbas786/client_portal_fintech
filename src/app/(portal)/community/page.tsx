'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { formatRelativeTime, getInitials, formatCurrencyDetailed } from '@/lib/utils'
import { Heart, MessageSquare, Flag, Pin, ImagePlus, Send, Filter, ChevronDown, Loader2, X } from 'lucide-react'
import type { PostTag } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  useInfinitePosts,
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePosts(filterTag)

  // Flatten all pages into one list
  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const total = data?.pages[0]?.total ?? 0

  const createPost = useCreatePost()
  const toggleLike = useToggleLike()

  // Auto-load next page when the sentinel div enters the viewport
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately so the user sees something straight away
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setImageUrl(null)
    setUploadError(false)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `community/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('community-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      setUploadError(false)
    } catch (err) {
      console.error('Image upload failed:', err)
      // Keep the preview visible — just mark it as failed so user can retry or remove
      setImageUrl(null)
      setUploadError(true)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage() {
    setImagePreview(null)
    setImageUrl(null)
    setUploadError(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function retryUpload() {
    // Re-open file picker so user can re-select the same image
    setUploadError(false)
    setImagePreview(null)
    setImageUrl(null)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const showAmount = selectedTag === 'PAYOUT' || selectedTag === 'AURUM_RESULTS'
  const selectedTagMeta = POST_TAGS.find((t) => t.value === selectedTag)!
  const filterLabel = filterTag === 'ALL' ? 'All Posts' : tagMeta[filterTag as keyof typeof tagMeta]?.label ?? filterTag

  function handlePost() {
    if (!content.trim() || createPost.isPending || uploading) return
    createPost.mutate(
      {
        content: content.trim(),
        tag: selectedTag,
        amount: showAmount && amount ? amount : null,
        imageUrl: imageUrl ?? null,
      },
      {
        onSuccess: () => {
          setContent('')
          setAmount('')
          setImageUrl(null)
          setImagePreview(null)
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
            {total > 0 && (
              <span className="ml-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
                {total} post{total !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {isFetching && !isLoading && !isFetchingNextPage && (
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

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="max-h-40 rounded-lg object-cover"
              style={{
                border: `1px solid ${uploadError ? 'var(--red)' : 'var(--border)'}`,
                opacity: uploading || uploadError ? 0.6 : 1,
              }}
            />

            {/* Uploading spinner overlay */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg gap-1"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <Loader2 size={20} className="animate-spin text-white" />
                <span className="text-[10px] text-white font-medium">Uploading…</span>
              </div>
            )}

            {/* Upload failed overlay */}
            {!uploading && uploadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg gap-2"
                style={{ background: 'rgba(0,0,0,0.65)' }}>
                <span className="text-[11px] text-white font-semibold">Upload failed</span>
                <button
                  onClick={retryUpload}
                  className="text-[10px] font-bold px-2 py-1 rounded"
                  style={{ background: 'var(--red)', color: '#fff' }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Remove button — only shown when not uploading/failed */}
            {!uploading && !uploadError && (
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 rounded-full p-0.5 transition-colors"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                title="Remove image"
              >
                <X size={12} />
              </button>
            )}

            {/* Always allow removal even on error */}
            {!uploading && uploadError && (
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 rounded-full p-0.5 transition-colors"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                title="Remove image"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach image"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] transition-all"
            style={{
              color: imageUrl ? 'var(--red)' : uploading ? 'var(--text-3)' : 'var(--text-3)',
              border: `1px solid ${imageUrl ? 'var(--red)' : 'var(--border)'}`,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          </button>

          <button
            onClick={handlePost}
            disabled={createPost.isPending || !content.trim() || uploading || uploadError}
            className="ml-auto flex items-center gap-2 px-4 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all"
            style={{ background: createPost.isPending || !content.trim() ? '#7a1a18' : 'var(--red)', opacity: !content.trim() || uploadError ? 0.5 : 1 }}
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
                {(post as any).imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(post as any).imageUrl}
                    alt="Post attachment"
                    className="rounded-lg max-h-64 object-cover mb-2 mt-1"
                    style={{ border: '1px solid var(--border)', maxWidth: '100%' }}
                  />
                )}
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

          {/* Sentinel — IntersectionObserver watches this to trigger next page load */}
          <div ref={sentinelRef} className="h-2" />

          {/* Loading next page spinner */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-6 gap-2" style={{ color: 'var(--text-3)' }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--red)' }} />
              <span className="text-[12px]">Loading more posts…</span>
            </div>
          )}

          {/* End of feed message */}
          {!hasNextPage && posts.length > 0 && (
            <div className="text-center py-6 text-[12px]" style={{ color: 'var(--text-3)' }}>
              ✓ You've seen all {total} post{total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
