'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Pencil, Trash2, X, Loader2, Search } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

type Role = 'STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN'

interface AdminUser {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  role: Role
  createdAt: string
  _count: { posts: number; tickets: number }
}

const ROLE_META: Record<Role, { bg: string; color: string }> = {
  STANDARD: { bg: 'var(--bg-3)', color: 'var(--text-3)' },
  AURUM: { bg: 'var(--gold-s)', color: 'var(--gold)' },
  BOARDROOM: { bg: 'var(--purple-s)', color: 'var(--purple)' },
  ADMIN: { bg: 'var(--red-s)', color: 'var(--red)' },
}

const ROLES: Role[] = ['STANDARD', 'AURUM', 'BOARDROOM', 'ADMIN']

// ─── Modal ────────────────────────────────────────────────────────────────────

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
      <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>Edit User</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

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
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Email</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none opacity-50"
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

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[7px] text-[13px] font-semibold" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
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
            {users.length} total users
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
        <div className="flex gap-2">
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
          style={{ gridTemplateColumns: '1fr 130px 70px 70px 110px 80px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
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
                style={{ gridTemplateColumns: '1fr 130px 70px 70px 110px 80px', borderBottom: '1px solid var(--border)' }}
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
                    title="Edit"
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

      {/* Edit modal */}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      {/* Delete confirm */}
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
