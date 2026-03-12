'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart2,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  TrendingUp,
  Wallet,
  Activity,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MTAccount {
  id: string
  login: string
  server: string
  platform: string
  name: string | null
}

interface AccountState {
  account: MTAccount
  info: {
    balance: number
    equity: number
    margin: number
    freeMargin: number
    leverage: number
    marginLevel: number
    currency: string
    broker?: string
  }
  floatingPl: number
  positions: { id: string; symbol: string; type: string; volume: number; profit: number }[]
  recentDeals: { id: string; symbol: string; profit: number; time: string }[]
  equityCurve?: { time: string; equity: number }[]
}

export default function PortfolioClient() {
  const qc = useQueryClient()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    login: '',
    password: '',
    server: '',
    platform: 'mt5' as 'mt4' | 'mt5',
    name: '',
  })

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['portfolio-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio/accounts')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      return data.accounts ?? []
    },
  })

  const addAccount = useMutation({
    mutationFn: async (body: typeof form) => {
      const res = await fetch('/api/portfolio/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-accounts'] })
      setShowAdd(false)
      setForm({ login: '', password: '', server: '', platform: 'mt5', name: '' })
    },
  })

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-accounts'] })
      setSelectedAccountId(null)
    },
  })

  const selectedAccount = accounts.find((a: MTAccount) => a.id === selectedAccountId)

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <BarChart2 size={20} style={{ color: 'var(--text-2)' }} /> Portfolio
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Connect and monitor your MT4/MT5 accounts.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--red)', color: '#fff' }}
        >
          <Plus size={16} /> Connect Account
        </button>
      </div>

      {/* Add account modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-[10px] p-6"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-1)' }}>
              Connect MT4/MT5 Account
            </h2>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text-3)' }}>
              Use your investor password for read-only access. Credentials are sent securely to MetaApi.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!form.login || !form.password || !form.server || !form.name) return
                addAccount.mutate(form)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Account name (for display)
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. FTMO Challenge"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Login
                </label>
                <input
                  type="text"
                  value={form.login}
                  onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                  placeholder="Account number"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Investor password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Read-only password"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Server
                </label>
                <input
                  value={form.server}
                  onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))}
                  placeholder="e.g. ICMarketsSC-Demo"
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Platform
                </label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as 'mt4' | 'mt5' }))}
                  className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                >
                  <option value="mt5">MetaTrader 5</option>
                  <option value="mt4">MetaTrader 4</option>
                </select>
              </div>
              {addAccount.error && (
                <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: 'var(--red-s)', color: 'var(--red)' }}>
                  {addAccount.error.message}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAccount.isPending}
                  className="flex-1 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--red)' }}
                >
                  {addAccount.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account list view */}
      {!selectedAccountId ? (
        loadingAccounts ? (
          <div className="flex gap-2 py-8" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Loading accounts…</span>
          </div>
        ) : accounts.length === 0 ? (
          <div
            className="rounded-[10px] p-12 text-center"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <BarChart2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-3)' }} />
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
              No accounts connected
            </p>
            <p className="text-[13px] mb-4" style={{ color: 'var(--text-3)' }}>
              Connect your MT4/MT5 account to view balance, equity curve, and trade history.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[7px] text-[13px] font-semibold"
              style={{ background: 'var(--red)', color: '#fff' }}
            >
              <Plus size={16} /> Connect Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc: MTAccount) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className="w-full text-left rounded-[10px] p-5 flex items-center justify-between transition-all hover:opacity-90"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
              >
                <div>
                  <div className="text-[15px] font-bold" style={{ color: 'var(--text-1)' }}>
                    {acc.name || `Account ${acc.login}`}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {acc.login} · {acc.server} · {acc.platform.toUpperCase()}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        )
      ) : selectedAccount ? (
        <AccountDetailView
          account={selectedAccount}
          onBack={() => setSelectedAccountId(null)}
          onDelete={() => deleteAccount.mutate(selectedAccount.id)}
          isDeleting={deleteAccount.isPending}
        />
      ) : null}
    </div>
  )
}

function AccountDetailView({
  account,
  onBack,
  onDelete,
  isDeleting,
}: {
  account: MTAccount
  onBack: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const { data: state, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['portfolio-state', account.id],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/accounts/${account.id}/state`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed')
      }
      return res.json() as Promise<AccountState>
    },
    refetchInterval: 60000,
  })

  const chartData =
    state?.equityCurve?.map((p) => ({
      ...p,
      date: new Date(p.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
      value: p.equity,
    })) ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:opacity-80"
          style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-1)' }}>
            {account.name || `Account ${account.login}`}
          </h2>
          <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            {account.login} · {account.server} · {account.platform.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ background: 'var(--red-s)', color: 'var(--red)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="p-5">
          {isLoading ? (
            <div className="flex gap-2 py-12" style={{ color: 'var(--text-3)' }}>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[13px]">Loading account data…</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-[13px]" style={{ color: 'var(--red)' }}>
                {error.message}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                Account may still be connecting. Try refreshing in a minute.
              </p>
            </div>
          ) : state ? (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={<Wallet size={16} />}
                  label="Balance"
                  value={formatCurrency(state.info.balance)}
                />
                <StatCard
                  icon={<TrendingUp size={16} />}
                  label="Equity"
                  value={formatCurrency(state.info.equity)}
                />
                <StatCard
                  icon={<Activity size={16} />}
                  label="Floating P&L"
                  value={formatCurrency(state.floatingPl)}
                  valueColor={state.floatingPl >= 0 ? 'var(--green)' : 'var(--red)'}
                />
                <StatCard
                  label="Margin"
                  value={`${state.info.marginLevel?.toFixed(1) ?? '-'}%`}
                />
              </div>

              {/* Equity curve */}
              {chartData.length > 1 && (
                <div>
                  <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-2)' }}>
                    Equity Curve
                  </h3>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--red)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--red)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                          stroke="var(--border)"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                          stroke="var(--border)"
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-1)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: 'var(--text-2)' }}
                          formatter={(value) => [value != null ? formatCurrency(value) : '—', 'Equity']}
                          labelFormatter={(label) => label}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="var(--red)"
                          strokeWidth={2}
                          fill="url(#equityGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Positions */}
              {state.positions.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                    Open Positions
                  </h3>
                  <div className="rounded-[8px] overflow-hidden" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr style={{ background: 'var(--bg-3)' }}>
                          <th className="text-left px-3 py-2" style={{ color: 'var(--text-3)' }}>Symbol</th>
                          <th className="text-left px-3 py-2" style={{ color: 'var(--text-3)' }}>Type</th>
                          <th className="text-right px-3 py-2" style={{ color: 'var(--text-3)' }}>Volume</th>
                          <th className="text-right px-3 py-2" style={{ color: 'var(--text-3)' }}>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.positions.map((p) => (
                          <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-1)' }}>{p.symbol}</td>
                            <td className="px-3 py-2" style={{ color: 'var(--text-2)' }}>{p.type?.replace('POSITION_TYPE_', '')}</td>
                            <td className="px-3 py-2 text-right" style={{ color: 'var(--text-2)' }}>{p.volume}</td>
                            <td className="px-3 py-2 text-right" style={{ color: p.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {formatCurrency(p.profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent deals */}
              {state.recentDeals.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                    Recent Trades
                  </h3>
                  <div className="rounded-[8px] overflow-hidden" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr style={{ background: 'var(--bg-3)' }}>
                          <th className="text-left px-3 py-2" style={{ color: 'var(--text-3)' }}>Symbol</th>
                          <th className="text-right px-3 py-2" style={{ color: 'var(--text-3)' }}>P&L</th>
                          <th className="text-right px-3 py-2" style={{ color: 'var(--text-3)' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.recentDeals.slice(0, 10).map((d) => (
                          <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-1)' }}>{d.symbol}</td>
                            <td className="px-3 py-2 text-right" style={{ color: d.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {formatCurrency(d.profit)}
                            </td>
                            <td className="px-3 py-2 text-right" style={{ color: 'var(--text-3)' }}>
                              {new Date(d.time).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div
      className="rounded-[8px] p-4"
      style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
    >
      {icon && <div className="mb-2" style={{ color: 'var(--text-3)' }}>{icon}</div>}
      <div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="text-[14px] font-bold" style={{ color: valueColor ?? 'var(--text-1)' }}>{value}</div>
    </div>
  )
}
