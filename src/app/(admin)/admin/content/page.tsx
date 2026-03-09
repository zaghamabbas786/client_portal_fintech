'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Video, Plus, Pencil, Trash2, X, Loader2, Star, UploadCloud, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'STANDARD' | 'AURUM' | 'BOARDROOM'
type FileType = 'EA_FILE' | 'SET_FILE' | 'PDF_GUIDE' | 'BROKER_SETTINGS'

interface EA { id: string; name: string }

interface Download {
  id: string
  name: string
  description: string | null
  fileType: FileType
  fileUrl: string
  version: string
  isLatest: boolean
  requiredRole: Role
  ea: EA | null
}

interface VideoItem {
  id: string
  title: string
  description: string | null
  duration: string | null
  embedUrl: string
  category: string
  isFeatured: boolean
  thumbnail: string | null
  requiredRole: Role
  sortOrder: number
}

const FILE_TYPE_META: Record<FileType, { emoji: string; label: string }> = {
  EA_FILE: { emoji: '📥', label: 'EA File' },
  PDF_GUIDE: { emoji: '📄', label: 'PDF Guide' },
  SET_FILE: { emoji: '⚙️', label: 'Set File' },
  BROKER_SETTINGS: { emoji: '📋', label: 'Broker Settings' },
}

const FILE_TYPES: FileType[] = ['EA_FILE', 'SET_FILE', 'PDF_GUIDE', 'BROKER_SETTINGS']
const ROLES: Role[] = ['STANDARD', 'AURUM', 'BOARDROOM']
const VIDEO_CATEGORIES = ['Getting Started', 'Risk Management', 'Scaling', 'Prop Firm Guides', 'Advanced']

// ─── Download Form Modal ──────────────────────────────────────────────────────

function DownloadModal({ item, eas, onClose }: { item?: Download; eas: EA[]; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!item
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [fileType, setFileType] = useState<FileType>(item?.fileType ?? 'EA_FILE')
  const [fileUrl, setFileUrl] = useState(item?.fileUrl ?? '')
  const [version, setVersion] = useState(item?.version ?? '1.0')
  const [isLatest, setIsLatest] = useState(item?.isLatest ?? true)
  const [requiredRole, setRequiredRole] = useState<Role>(item?.requiredRole ?? 'STANDARD')
  const [eaId, setEaId] = useState(item?.ea?.id ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [urlMode, setUrlMode] = useState(false) // toggle between upload and paste URL

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `ea-files/${Date.now()}-${safeName}`

      const { error } = await supabase.storage
        .from('ea-files')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('ea-files').getPublicUrl(path)
      setFileUrl(publicUrl)
      setUploadedFileName(file.name)

      // Auto-fill name if empty
      if (!name) {
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setName(baseName)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Make sure the "ea-files" bucket exists in Supabase Storage.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const save = useMutation({
    mutationFn: (body: object) => {
      const url = isEdit ? `/api/admin/content/downloads/${item!.id}` : '/api/admin/content/downloads'
      return fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json())
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] })
      onClose()
    },
  })

  const body = { name, description, fileType, fileUrl, version, isLatest, requiredRole, eaId: eaId || null }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-lg rounded-xl p-6 overflow-y-auto" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>{isEdit ? 'Edit Download' : 'New Download'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>File Type *</label>
              <select value={fileType} onChange={(e) => setFileType(e.target.value as FileType)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                {FILE_TYPES.map((t) => <option key={t} value={t}>{FILE_TYPE_META[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Version *</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
            </div>
          </div>

          {/* File upload / URL section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>File *</label>
              <button
                type="button"
                onClick={() => setUrlMode(!urlMode)}
                className="text-[11px] flex items-center gap-1 transition-colors"
                style={{ color: 'var(--text-3)' }}
              >
                {urlMode ? <><UploadCloud size={11} /> Upload instead</> : <><LinkIcon size={11} /> Paste URL instead</>}
              </button>
            </div>

            {urlMode ? (
              /* Manual URL input */
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            ) : (
              /* File upload button */
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".ex4,.ex5,.set,.pdf,.zip,.rar,.mq4,.mq5"
                  onChange={handleFileUpload}
                />
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="w-full rounded-lg px-4 py-4 text-center cursor-pointer transition-all"
                  style={{
                    background: 'var(--bg-1)',
                    border: `2px dashed ${fileUrl && !urlMode ? 'var(--green)' : 'var(--border)'}`,
                    color: 'var(--text-3)',
                  }}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--red)' }} />
                      <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Uploading…</span>
                    </div>
                  ) : fileUrl && uploadedFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-400 text-[13px] font-semibold">✓ {uploadedFileName}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>(click to replace)</span>
                    </div>
                  ) : fileUrl && isEdit ? (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud size={20} />
                      <span className="text-[12px]">Click to upload new file</span>
                      <span className="text-[11px]" style={{ color: 'var(--green)' }}>Current file saved ✓</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <UploadCloud size={22} />
                      <span className="text-[13px] font-medium" style={{ color: 'var(--text-2)' }}>Click to upload file</span>
                      <span className="text-[11px]">.ex4 · .ex5 · .set · .pdf · .zip</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Required Role</label>
              <select value={requiredRole} onChange={(e) => setRequiredRole(e.target.value as Role)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>EA (optional)</label>
              <select value={eaId} onChange={(e) => setEaId(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                <option value="">— None —</option>
                {eas.map((ea) => <option key={ea.id} value={ea.id}>{ea.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isLatest} onChange={(e) => setIsLatest(e.target.checked)} className="w-4 h-4" />
            <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Mark as latest version</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>Cancel</button>
          <button
            onClick={() => save.mutate(body)}
            disabled={save.isPending || uploading || !name || !fileUrl || !version}
            className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--red)', opacity: !name || !fileUrl || uploading ? 0.5 : 1 }}
          >
            {save.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Download'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Video Form Modal ─────────────────────────────────────────────────────────

function VideoModal({ item, onClose }: { item?: VideoItem; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!item

  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [duration, setDuration] = useState(item?.duration ?? '')
  const [embedUrl, setEmbedUrl] = useState(item?.embedUrl ?? '')
  const [category, setCategory] = useState(item?.category ?? 'Getting Started')
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false)
  const [thumbnail, setThumbnail] = useState(item?.thumbnail ?? '')
  const [requiredRole, setRequiredRole] = useState<Role>(item?.requiredRole ?? 'STANDARD')
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0)

  const save = useMutation({
    mutationFn: (body: object) => {
      const url = isEdit ? `/api/admin/content/videos/${item!.id}` : '/api/admin/content/videos'
      return fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json())
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] })
      onClose()
    },
  })

  const body = { title, description, duration, embedUrl, category, isFeatured, thumbnail: thumbnail || null, requiredRole, sortOrder }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-lg rounded-xl p-6 overflow-y-auto" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>{isEdit ? 'Edit Video' : 'New Video'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Embed URL * (YouTube/Vimeo)</label>
            <input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://youtube.com/embed/…" className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                {VIDEO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Duration (e.g. 8:21)</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="8:21" className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Required Role</label>
              <select value={requiredRole} onChange={(e) => setRequiredRole(e.target.value as Role)} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Thumbnail URL (optional)</label>
            <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…" className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4" />
            <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Mark as featured</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>Cancel</button>
          <button
            onClick={() => save.mutate(body)}
            disabled={save.isPending || !title || !embedUrl}
            className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--red)', opacity: !title || !embedUrl ? 0.5 : 1 }}
          >
            {save.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Video'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminContentPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'downloads' | 'videos'>('downloads')
  const [dlModal, setDlModal] = useState<Download | null | true>(null) // true = new
  const [vidModal, setVidModal] = useState<VideoItem | null | true>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'download' | 'video'; id: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content'],
    queryFn: (): Promise<{ downloads: Download[]; eas: EA[]; videos?: VideoItem[] }> =>
      Promise.all([
        fetch('/api/admin/content/downloads').then((r) => r.json()),
        fetch('/api/admin/content/videos').then((r) => r.json()),
      ]).then(([dl, vid]) => ({ ...dl, videos: vid.videos })),
  })

  const deleteItem = useMutation({
    mutationFn: ({ type, id }: { type: 'download' | 'video'; id: string }) =>
      fetch(`/api/admin/content/${type === 'download' ? 'downloads' : 'videos'}/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] })
      setConfirmDelete(null)
    },
  })

  const downloads = data?.downloads ?? []
  const videos = data?.videos ?? []
  const eas = data?.eas ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>Content Management</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Manage downloads, videos, and resources.</p>
        </div>
        <button
          onClick={() => tab === 'downloads' ? setDlModal(true) : setVidModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[7px] text-[13px] font-semibold text-white"
          style={{ background: 'var(--red)' }}
        >
          <Plus size={14} /> Add {tab === 'downloads' ? 'Download' : 'Video'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        {(['downloads', 'videos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all capitalize flex items-center gap-2"
            style={{
              background: tab === t ? 'var(--bg-3)' : 'transparent',
              color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
            }}
          >
            {t === 'downloads' ? <FileText size={13} /> : <Video size={13} />}
            {t} {t === 'downloads' ? `(${downloads.length})` : `(${videos.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : tab === 'downloads' ? (
        /* Downloads table */
        <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]" style={{ gridTemplateColumns: '1fr 100px 100px 80px 70px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
            <span>FILE</span><span>TYPE</span><span>EA</span><span>ROLE</span><span className="text-right">ACTIONS</span>
          </div>
          {downloads.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>No downloads yet.</div>
          ) : downloads.map((d) => (
            <div key={d.id} className="grid px-5 py-3 text-[13px] items-center" style={{ gridTemplateColumns: '1fr 100px 100px 80px 70px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                  {FILE_TYPE_META[d.fileType].emoji} {d.name}
                  {d.isLatest && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--green-s)', color: 'var(--green)' }}>LATEST</span>}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>v{d.version}</div>
              </div>
              <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>{FILE_TYPE_META[d.fileType].label}</div>
              <div className="text-[12px]" style={{ color: 'var(--text-3)' }}>{d.ea?.name ?? '—'}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>{d.requiredRole}</span>
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setDlModal(d)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--bg-3)' }}><Pencil size={13} /></button>
                <button onClick={() => setConfirmDelete({ type: 'download', id: d.id })} className="p-1.5 rounded-lg" style={{ color: 'var(--red)', background: 'var(--red-s)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Videos table */
        <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]" style={{ gridTemplateColumns: '1fr 140px 80px 60px 70px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
            <span>VIDEO</span><span>CATEGORY</span><span>ROLE</span><span>ORDER</span><span className="text-right">ACTIONS</span>
          </div>
          {videos.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>No videos yet.</div>
          ) : videos.map((v) => (
            <div key={v.id} className="grid px-5 py-3 text-[13px] items-center" style={{ gridTemplateColumns: '1fr 140px 80px 60px 70px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="font-semibold flex items-center gap-2" style={{ color: v.isFeatured ? 'var(--gold)' : 'var(--text-1)' }}>
                  {v.isFeatured && <Star size={12} fill="currentColor" />}
                  {v.title}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{v.duration ?? '—'}</div>
              </div>
              <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>{v.category}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>{v.requiredRole}</span>
              <div className="font-mono text-[12px]" style={{ color: 'var(--text-3)' }}>{v.sortOrder}</div>
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setVidModal(v)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--bg-3)' }}><Pencil size={13} /></button>
                <button onClick={() => setConfirmDelete({ type: 'video', id: v.id })} className="p-1.5 rounded-lg" style={{ color: 'var(--red)', background: 'var(--red-s)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download modal */}
      {dlModal !== null && (
        <DownloadModal item={dlModal === true ? undefined : dlModal} eas={eas} onClose={() => setDlModal(null)} />
      )}

      {/* Video modal */}
      {vidModal !== null && (
        <VideoModal item={vidModal === true ? undefined : vidModal} onClose={() => setVidModal(null)} />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: 'var(--red)' }} />
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text-1)' }}>Delete {confirmDelete.type === 'download' ? 'Download' : 'Video'}?</h3>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>Cancel</button>
              <button
                onClick={() => deleteItem.mutate(confirmDelete)}
                disabled={deleteItem.isPending}
                className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--red)' }}
              >
                {deleteItem.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
