import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  getAccountInformation,
  getPositions,
  getDeals,
} from '@/lib/metaapi'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const hasAccess = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  if (!hasAccess) return NextResponse.json({ error: 'Portfolio access required' }, { status: 403 })

  const { id } = await params
  const account = await prisma.mTAccount.findFirst({
    where: { id, userId: userProfile.id },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  if (!process.env.METAAPI_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MetaApi not configured' }, { status: 503 })
  }

  const region = account.region ?? undefined

  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 90)

    const [info, positions, deals] = await Promise.all([
      getAccountInformation(account.metaApiAccountId, region),
      getPositions(account.metaApiAccountId, region),
      getDeals(
        account.metaApiAccountId,
        start.toISOString(),
        end.toISOString(),
        region
      ),
    ])

    const floatingPl = positions.reduce((sum, p) => sum + (p.profit ?? 0), 0)

    // Build equity curve from deals: cumulative P&L over time
    const sortedDeals = [...deals].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    )
    const totalProfit = sortedDeals.reduce((s, d) => s + (d.profit ?? 0), 0)
    const startBalance = info.balance - totalProfit
    let cumulative = startBalance
    const equityCurve: { time: string; equity: number }[] = [
      { time: start.toISOString(), equity: startBalance },
    ]
    for (const d of sortedDeals) {
      cumulative += d.profit ?? 0
      equityCurve.push({ time: d.time, equity: cumulative })
    }
    equityCurve.push({ time: end.toISOString(), equity: info.equity })

    return NextResponse.json({
      account: {
        id: account.id,
        login: account.login,
        server: account.server,
        platform: account.platform,
        name: account.name,
      },
      info: {
        balance: info.balance,
        equity: info.equity,
        margin: info.margin,
        freeMargin: info.freeMargin,
        leverage: info.leverage,
        marginLevel: info.marginLevel,
        currency: info.currency,
        broker: info.broker,
      },
      floatingPl,
      positions,
      recentDeals: deals.slice(0, 20),
      equityCurve,
    })
  } catch (err) {
    console.error('MetaApi state error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to fetch account state'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
