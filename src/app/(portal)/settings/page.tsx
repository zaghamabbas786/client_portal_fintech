'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2, Check } from 'lucide-react'

export default function SettingsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [communityAlerts, setCommunityAlerts] = useState(true)
  const [payoutUpdates, setPayoutUpdates] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setFullName(data.user.fullName || '')
          setEmail(data.user.email || '')
          setPhone(data.user.phone || '')
          setEmailNotifications(data.user.emailNotifications ?? true)
          setCommunityAlerts(data.user.communityAlerts ?? true)
          setPayoutUpdates(data.user.payoutUpdates ?? true)
        }
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, emailNotifications, communityAlerts, payoutUpdates }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: value ? 'var(--red)' : 'var(--bg-3)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: '#fff',
            left: value ? '22px' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Settings size={20} style={{ color: 'var(--text-2)' }} /> Settings
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Manage your profile and preferences.
        </p>
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

          {/* Avatar placeholder */}
          <div className="mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white cursor-pointer relative group"
              style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
            >
              {fullName ? fullName[0].toUpperCase() : 'U'}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-semibold">
                Edit
              </div>
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
              {
                label: 'Email Notifications',
                desc: 'Receive updates via email',
                value: emailNotifications,
                onChange: setEmailNotifications,
              },
              {
                label: 'Community Alerts',
                desc: 'Get notified about community activity',
                value: communityAlerts,
                onChange: setCommunityAlerts,
              },
              {
                label: 'Payout Updates',
                desc: 'Notifications about payout and results',
                value: payoutUpdates,
                onChange: setPayoutUpdates,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>
                    {item.label}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                    {item.desc}
                  </div>
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
