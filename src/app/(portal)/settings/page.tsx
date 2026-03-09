'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings, Loader2, Check, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSettings, useUpdateSettings, useUpdateAvatar } from '@/hooks/useSettings'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { data: user, isLoading, isFetching } = useSettings()
  const updateSettings = useUpdateSettings()
  const updateAvatar = useUpdateAvatar()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [communityAlerts, setCommunityAlerts] = useState(true)
  const [payoutUpdates, setPayoutUpdates] = useState(true)

  // Sync form state when user data loads (from cache or network)
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '')
      setEmailNotifications(user.emailNotifications ?? true)
      setCommunityAlerts(user.communityAlerts ?? true)
      setPayoutUpdates(user.payoutUpdates ?? true)
    }
  }, [user])

  const avatarUrl = user?.avatarUrl ?? null
  const email = user?.email ?? ''

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateAvatar.mutateAsync(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Upload failed. Make sure the "avatars" bucket exists in Supabase Storage (public bucket).')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateSettings.mutateAsync({
        fullName,
        phone,
        emailNotifications,
        communityAlerts,
        payoutUpdates,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // Error handled by mutation
    }
  }

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() || 'U'

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: value ? 'var(--red)' : 'var(--bg-3)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            background: '#fff',
            left: value ? '22px' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    )
  }

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
      </div>
    )
  }

  const saving = updateSettings.isPending

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Settings size={20} style={{ color: 'var(--text-2)' }} /> Settings
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Manage your profile and preferences.
          </p>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={12} className="animate-spin" />
            Updating…
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="max-w-[540px]">
        {/* Profile */}
        <div
          className="rounded-[10px] p-6 mb-5"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-semibold mb-5" style={{ color: 'var(--text-1)' }}>
            Profile
          </h2>

          {/* Avatar upload */}
          <div className="mb-5 flex items-center gap-4">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <button
              type="button"
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 group"
              style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
              title="Click to change profile picture"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center font-bold text-xl text-white">
                  {initials}
                </span>
              )}

              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 transition-opacity"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  opacity: avatarUploading ? 1 : 0,
                }}
              >
                {avatarUploading && <Loader2 size={18} className="animate-spin text-white" />}
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.55)' }}
              >
                <Camera size={16} className="text-white" />
                <span className="text-[9px] font-semibold text-white">CHANGE</span>
              </div>
            </button>

            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>
                Profile Photo
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                Click the photo to upload a new one
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                JPG, PNG or WebP · Max 5 MB
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none cursor-not-allowed"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                Email cannot be changed here. Contact support.
              </p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div
          className="rounded-[10px] p-6 mb-5"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-semibold mb-5" style={{ color: 'var(--text-1)' }}>
            Notifications
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifications, onChange: setEmailNotifications },
              { label: 'Community Alerts', desc: 'Get notified about community activity', value: communityAlerts, onChange: setCommunityAlerts },
              { label: 'Payout Updates', desc: 'Notifications about payout and results', value: payoutUpdates, onChange: setPayoutUpdates },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{item.label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{item.desc}</div>
                </div>
                <Toggle value={item.value} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-[7px] text-[13px] font-semibold text-white transition-all"
          style={{ background: saved ? 'var(--green)' : saving ? '#b71c1c' : 'var(--red)', width: '200px' }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saved && <Check size={14} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </form>
    </div>
  )
}
