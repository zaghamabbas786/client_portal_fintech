'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Pencil, Trash2, X, Loader2, Search, KeyRound, Plus, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

type Role = 'STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN'
type EAStatus = 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'

interface AdminUser {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  role: Role
  createdAt: string
  _count: { posts: number; tickets: number }
}

interface EA { id: string; name: string; version: string; requiredRole: Role }

interface UserEA {
  id: string
  eaId: string
  accountNumber: string | null
  broker: string | null
  status: EAStatus
  assignedAt: string
  ea: EA
}

const ROLE_META: Record<Role, { bg: string; color: string }> = {
  STANDARD:  { bg: 'var(--bg-3)',     color: 'var(--text-3)' },
  AURUM:     { bg: 'var(--gold-s)',   color: 'var(--gold)'   },
  BOARDROOM: { bg: 'var(--purple-s)', color: 'var(--purple)' },
  ADMIN:     { bg: 'var(--red-s)',    color: 'var(--red)'    },
}

const ROLES: Role[] = ['STANDARD', 'AURUM', 'BOARDROOM', 'ADMIN']

// ─── EA Licenses sub-section ──────────────────────────────────────────────────

function EALicensesSection({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const [showAssign, setShowAssign] = useState(false)
  const [selectedEaId, setSelectedEaId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [broker, setBroker] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-eas', userId],
    queryFn: (): Promise<{ userEAs: UserEA[]; allEAs: EA[] }> =>
      fetch(`/api/admin/users/${userId}/eas`).then((r) => r.json()),
  })

  const assign = useMutation({
    mutationFn: (body: { eaId: string; accountNumber: string; broker: string }) =>
      fetch(`/api/admin/users/${userId}/eas`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user-eas', userId] })
      setShowAssign(false)
      setSelectedEaId('')
      setAccountNumber('')
      setBroker('')
    },
  })

  const toggleStatus = useMutation({
    mutationFn: ({ eaId, status }: { eaId: string; status: EAStatus }) =>
      fetch(`/api/admin/users/${userId}/eas/${eaId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-eas', userId] }),
  })

  const revoke = useMutation({
    mutationFn: (eaId: string) =>
      fetch(`/api/admin/users/${userId}/eas/${eaId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-eas', userId] }),
  })

  const userEAs = data?.userEAs ?? []
  const allEAs = data?.allEAs ?? []
  const assignedEaIds = new Set(userEAs.map((u) => u.eaId))
  const availableEAs = allEAs.filter((ea) => !assignedEaIds.has(ea.id))

  return (
    <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <KeyRound size={14} style={{ color: 'var(--text-3)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>EA Licenses</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
            {userEAs.length}
          </span>
        </div>
        {availableEAs.length > 0 && (
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: showAssign ? 'var(--red-s)' : 'var(--bg-3)', color: showAssign ? 'var(--red)' : 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            <Plus size={11} /> Assign EA
          </button>
        )}
      </div>

      {/* Assign form */}
      {showAssign && (
        <div className="rounded-lg p-3 mb-3 space-y-2" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Select EA *</label>
            <select
              value={selectedEaId}
              onChange={(e) => setSelectedEaId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              <option value="">— Choose EA —</option>
              {availableEAs.map((ea) => (
                <option key={ea.id} value={ea.id}>{ea.name} v{ea.version}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Account Number</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 4521893"
                className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Broker / Prop Firm</label>
              <input
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="e.g. FTMO"
                className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAssign(false)}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => assign.mutate({ eaId: selectedEaId, accountNumber, broker })}
              disabled={!selectedEaId || assign.isPending}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ background: 'var(--red)', opacity: !selectedEaId ? 0.5 : 1 }}
            >
              {assign.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-4 flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && userEAs.length === 0 && (
        <p className="text-[12px] py-2" style={{ color: 'var(--text-3)' }}>
          No EA licenses assigned yet.
        </p>
      )}

      {/* License list */}
      <div className="space-y-2">
        {userEAs.map((uea) => (
          <div
            key={uea.eaId}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-base flex-shrink-0"
                style={{ background: uea.status === 'ACTIVE' ? 'var(--green-s)' : 'var(--bg-3)' }}
              >
                ⚡
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>
                  {uea.ea.name}
                  <span className="ml-1 text-[10px] font-normal" style={{ color: 'var(--text-3)' }}>v{uea.ea.version}</span>
                </div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>
                  {uea.broker || 'No broker'} · Acc: {uea.accountNumber || 'Not set'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {/* Active/Inactive toggle */}
              <button
                onClick={() => toggleStatus.mutate({
                  eaId: uea.eaId,
                  status: uea.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                })}
                disabled={toggleStatus.isPending}
                title={uea.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  background: uea.status === 'ACTIVE' ? 'var(--green-s)' : 'var(--bg-3)',
                  color: uea.status === 'ACTIVE' ? 'var(--green)' : 'var(--text-3)',
                }}
              >
                {uea.status === 'ACTIVE'
                  ? <CheckCircle size={13} />
                  : <XCircle size={13} />
                }
              </button>

              {/* Revoke */}
              <button
                onClick={() => revoke.mutate(uea.eaId)}
                disabled={revoke.isPending}
                title="Revoke license"
                className="p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--red-s)', color: 'var(--red)' }}
              >
                {revoke.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient()
  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [role, setRole] = useState<Role>(user.role)

  const update = useMutation({
    mutationFn: (body: { fullName: string; phone: string; role: Role }) =>
      fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="w-full max-w-md rounded-xl p-6 overflow-y-auto"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>Edit User</h2>
            <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

        {/* Profile fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Role</label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => {
                const meta = ROLE_META[r]
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                    style={{
                      background: role === r ? meta.bg : 'var(--bg-3)',
                      color: role === r ? meta.color : 'var(--text-3)',
                      border: role === r ? `1px solid ${meta.color}` : '1px solid transparent',
                    }}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => update.mutate({ fullName, phone, role })}
            disabled={update.isPending}
            className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'var(--red)' }}
          >
            {update.isPending && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>

        {/* EA Licenses section */}
        <EALicensesSection userId={user.id} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: (): Promise<{ users: AdminUser[] }> =>
      fetch('/api/admin/users').then((r) => r.json()),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setConfirmDelete(null)
    },
  })

  const users = data?.users ?? []
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Users size={20} style={{ color: 'var(--text-2)' }} /> User Management
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            {users.length} total users — click ✏️ to edit profile & assign EA licenses
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', ...ROLES] as (Role | 'ALL')[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: roleFilter === r ? (r === 'ALL' ? 'var(--red)' : ROLE_META[r as Role].bg) : 'var(--bg-2)',
                color: roleFilter === r ? (r === 'ALL' ? '#fff' : ROLE_META[r as Role].color) : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 130px 60px 60px 110px 80px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>USER</span><span>JOINED</span><span>POSTS</span><span>TICKETS</span><span>ROLE</span><span className="text-right">ACTIONS</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>No users found.</div>
        ) : (
          filtered.map((user) => {
            const meta = ROLE_META[user.role]
            return (
              <div
                key={user.id}
                className="grid px-5 py-3 text-[13px] items-center"
                style={{ gridTemplateColumns: '1fr 130px 60px 60px 110px 80px', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
                  >
                    {getInitials(user.fullName || user.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate" style={{ color: 'var(--text-1)' }}>{user.fullName || '—'}</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{user.email}</div>
                  </div>
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-3)' }}>{formatDate(user.createdAt, 'MMM d, yyyy')}</div>
                <div className="font-mono" style={{ color: 'var(--text-2)' }}>{user._count.posts}</div>
                <div className="font-mono" style={{ color: 'var(--text-2)' }}>{user._count.tickets}</div>
                <span className="text-[10px] font-bold px-[9px] py-[3px] rounded-full w-fit" style={{ background: meta.bg, color: meta.color }}>
                  {user.role}
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setEditUser(user)}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ color: 'var(--text-3)', background: 'var(--bg-3)' }}
                    title="Edit user & manage EA licenses"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(user.id)}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ color: 'var(--red)', background: 'var(--red-s)' }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: 'var(--red)' }} />
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--text-1)' }}>Delete User?</h3>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>
              This will permanently delete the user and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                Cancel
              </button>
              <button
                onClick={() => deleteUser.mutate(confirmDelete)}
                disabled={deleteUser.isPending}
                className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--red)' }}
              >
                {deleteUser.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
