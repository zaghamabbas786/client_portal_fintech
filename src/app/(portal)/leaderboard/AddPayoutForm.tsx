'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Loader2, ImagePlus, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const SYSTEMS = ['Aurum', 'Omni'] as const

export default function AddPayoutForm() {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [propFirm, setPropFirm] = useState('')
  const [amount, setAmount] = useState('')
  const [system, setSystem] = useState<'Aurum' | 'Omni'>('Aurum')
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)

  const now = new Date()
  const [month, setMonth] = useState(now.toLocaleString('en-US', { month: 'long' }))
  const [year, setYear] = useState(now.getFullYear())

  const submitPayout = useMutation({
    mutationFn: async () => {
      if (!proofUrl || !propFirm.trim() || !amount) throw new Error('Missing fields')
      const numAmount = parseFloat(amount.replace(/,/g, ''))
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount')

      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propFirm: propFirm.trim(),
          amount: numAmount,
          proofUrl,
          system,
          month,
          year,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      return data
    },
    onSuccess: () => {
      setShowForm(false)
      setPropFirm('')
      setAmount('')
      setProofUrl(null)
      setProofFile(null)
      qc.invalidateQueries({ queryKey: ['payouts'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setUploadError(true)
      return
    }

    setProofFile(file)
    setUploadError(false)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `payouts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('payout-proofs')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('payout-proofs')
        .getPublicUrl(filePath)

      setProofUrl(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError(true)
      setProofUrl(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function resetForm() {
    setShowForm(false)
    setPropFirm('')
    setAmount('')
    setProofUrl(null)
    setProofFile(null)
    setUploadError(false)
  }

  const canSubmit = propFirm.trim() && amount && proofUrl && !submitPayout.isPending && !uploading

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold transition-all hover:opacity-90"
        style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
      >
        <Plus size={14} /> Add Payout
      </button>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={resetForm}
        >
          <div
            className="w-full max-w-md rounded-[10px] p-6"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>
                Add Payout
              </h2>
              <button onClick={resetForm} style={{ color: 'var(--text-3)' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-[12px] mb-4" style={{ color: 'var(--text-3)' }}>
              Log your payout for the leaderboard. Upload proof (certificate or email) for internal verification.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit) submitPayout.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Prop firm
                </label>
                <input
                  value={propFirm}
                  onChange={(e) => setPropFirm(e.target.value)}
                  placeholder="e.g. FTMO, MyForexFunds"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Amount ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 5000"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  System
                </label>
                <select
                  value={system}
                  onChange={(e) => setSystem(e.target.value as 'Aurum' | 'Omni')}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                >
                  {SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Month / Year
                </label>
                <div className="flex gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className="w-24 rounded-lg px-3 py-2.5 text-[13px] outline-none"
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Proof (certificate or email screenshot)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-lg px-3 py-3 text-[13px] flex items-center justify-center gap-2 border-2 border-dashed transition-colors"
                  style={{
                    background: proofUrl ? 'var(--green-s)' : 'var(--bg-1)',
                    borderColor: uploadError ? 'var(--red)' : proofUrl ? 'var(--green)' : 'var(--border)',
                    color: uploadError ? 'var(--red)' : proofUrl ? 'var(--green)' : 'var(--text-2)',
                  }}
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {uploading ? 'Uploading…' : proofUrl ? `✓ ${proofFile?.name || 'Proof uploaded'}` : 'Click to upload'}
                </button>
                {uploadError && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>
                    Upload failed. Try again (JPEG, PNG, WebP, or PDF).
                  </p>
                )}
              </div>

              {submitPayout.error && (
                <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: 'var(--red-s)', color: 'var(--red)' }}>
                  {submitPayout.error.message}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold flex items-center justify-center gap-2"
                  style={{ background: 'var(--gold)', color: 'var(--bg-0)', opacity: canSubmit ? 1 : 0.5 }}
                >
                  {submitPayout.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
