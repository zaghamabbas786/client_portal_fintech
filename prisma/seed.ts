import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── EAs ──────────────────────────────────────────────────────────────────
  const omni = await prisma.eA.upsert({
    where: { id: 'ea-omni' },
    update: {},
    create: {
      id: 'ea-omni',
      name: 'Omni EA',
      description: 'Multi-strategy EA for prop firms',
      version: '2.2',
      requiredRole: 'STANDARD',
      status: 'ACTIVE',
    },
  })

  const asiaScalper = await prisma.eA.upsert({
    where: { id: 'ea-asia' },
    update: {},
    create: {
      id: 'ea-asia',
      name: 'Asia Scalper',
      description: 'Asian session scalping strategy',
      version: '2.1',
      requiredRole: 'STANDARD',
      status: 'ACTIVE',
    },
  })

  const aurum = await prisma.eA.upsert({
    where: { id: 'ea-aurum' },
    update: {},
    create: {
      id: 'ea-aurum',
      name: 'Aurum EA',
      description: 'Flagship 9-strategy system',
      version: '4.2',
      requiredRole: 'AURUM',
      status: 'ACTIVE',
    },
  })

  // ─── Downloads ────────────────────────────────────────────────────────────
  const downloadsData = [
    { id: 'dl-omni-ea',      eaId: omni.id,         name: 'Omni EA v2.2',          description: 'EA File · v2.2',          fileType: 'EA_FILE'       as const, fileUrl: '#', version: '2.2', requiredRole: 'STANDARD' as const },
    { id: 'dl-omni-guide',   eaId: omni.id,         name: 'Omni Setup Guide',       description: 'Setup Guide · v2',        fileType: 'PDF_GUIDE'     as const, fileUrl: '#', version: '2.0', requiredRole: 'STANDARD' as const },
    { id: 'dl-omni-set',     eaId: omni.id,         name: 'Omni Set Files Pack',    description: 'Set Files · v2',          fileType: 'SET_FILE'      as const, fileUrl: '#', version: '2.0', requiredRole: 'STANDARD' as const },
    { id: 'dl-omni-broker',  eaId: omni.id,         name: 'Omni Broker Settings',   description: 'Broker Settings · v1',   fileType: 'BROKER_SETTINGS' as const, fileUrl: '#', version: '1.0', requiredRole: 'STANDARD' as const },
    { id: 'dl-asia-ea',      eaId: asiaScalper.id,  name: 'Asia Scalper EA v2.1',   description: 'EA File · v2.1',          fileType: 'EA_FILE'       as const, fileUrl: '#', version: '2.1', requiredRole: 'STANDARD' as const },
    { id: 'dl-asia-guide',   eaId: asiaScalper.id,  name: 'Asia Scalper Guide',     description: 'Setup Guide · v2',        fileType: 'PDF_GUIDE'     as const, fileUrl: '#', version: '2.0', requiredRole: 'STANDARD' as const },
    { id: 'dl-asia-set',     eaId: asiaScalper.id,  name: 'Asia Scalper Set Files', description: 'Set Files · v2.1',        fileType: 'SET_FILE'      as const, fileUrl: '#', version: '2.1', requiredRole: 'STANDARD' as const },
    { id: 'dl-aurum-ea',     eaId: aurum.id,        name: 'Aurum EA v4.2',          description: 'EA File · v4.2',          fileType: 'EA_FILE'       as const, fileUrl: '#', version: '4.2', requiredRole: 'AURUM'    as const },
    { id: 'dl-aurum-guide',  eaId: aurum.id,        name: 'Aurum Setup Guide',      description: 'Setup Guide · v4',        fileType: 'PDF_GUIDE'     as const, fileUrl: '#', version: '4.0', requiredRole: 'AURUM'    as const },
    { id: 'dl-aurum-set',    eaId: aurum.id,        name: 'Aurum Set Files',        description: 'Set Files · v4.2',        fileType: 'SET_FILE'      as const, fileUrl: '#', version: '4.2', requiredRole: 'AURUM'    as const },
  ]

  for (const d of downloadsData) {
    await prisma.download.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    })
  }

  // ─── Videos ───────────────────────────────────────────────────────────────
  const videosData = [
    { id: 'vid-1', title: 'Getting Started with Omni EA',       duration: '8:21',  embedUrl: 'https://loom.com/share/placeholder', category: 'Getting Started',    isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 1 },
    { id: 'vid-2', title: 'Installing Your EA on MT4/MT5',       duration: '8:15',  embedUrl: 'https://loom.com/share/placeholder', category: 'Getting Started',    isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 2 },
    { id: 'vid-3', title: 'FTMO Challenge Setup Guide',          duration: '12:20', embedUrl: 'https://loom.com/share/placeholder', category: 'Prop Firm Guides',   isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 3 },
    { id: 'vid-4', title: 'MyForexFunds Best Practices',         duration: '11:00', embedUrl: 'https://loom.com/share/placeholder', category: 'Prop Firm Guides',   isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 4 },
    { id: 'vid-5', title: 'Risk Management Fundamentals',        duration: '12:30', embedUrl: 'https://loom.com/share/placeholder', category: 'Risk Management',    isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 5 },
    { id: 'vid-6', title: 'Position Sizing for Prop Firms',      duration: '9:45',  embedUrl: 'https://loom.com/share/placeholder', category: 'Risk Management',    isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 6 },
    { id: 'vid-7', title: 'How Top Clients Scale to £10k+/mo',   duration: '25:18', embedUrl: 'https://loom.com/share/placeholder', category: 'Scaling',            isFeatured: true,  requiredRole: 'STANDARD' as const, sortOrder: 7 },
    { id: 'vid-8', title: 'Multi-Account Management',            duration: '14:30', embedUrl: 'https://loom.com/share/placeholder', category: 'Scaling',            isFeatured: false, requiredRole: 'STANDARD' as const, sortOrder: 8 },
  ]

  for (const v of videosData) {
    await prisma.video.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    })
  }

  // ─── Ticker items ─────────────────────────────────────────────────────────
  const tickerItems = [
    { id: 'tick-1', text: 'Marcus T. — Aurum payout',           amount: 4218, sortOrder: 0 },
    { id: 'tick-2', text: 'James R. — Omni payout',             amount: 1847, sortOrder: 1 },
    { id: 'tick-3', text: 'Karen W. — Just activated Aurum 🚀', amount: null, sortOrder: 2 },
    { id: 'tick-4', text: 'Larry O. — Aurum payout',            amount: 5604, sortOrder: 3 },
    { id: 'tick-5', text: 'Sarah B. — Omni payout',             amount: 3210, sortOrder: 4 },
    { id: 'tick-6', text: 'Gio A. — Aurum payout',              amount: 8613, sortOrder: 5 },
    { id: 'tick-7', text: 'Dave H. — Challenge passed ✅',      amount: null, sortOrder: 6 },
  ]

  for (const t of tickerItems) {
    await prisma.tickerItem.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    })
  }

  // ─── Demo users (for community posts & leaderboard) ───────────────────────
  const demoUsers = [
    { id: 'demo-user-1', supabaseId: 'demo-sb-1111-1111-1111-111111111111', email: 'aiden@demo.eostrading.com',  fullName: 'Aiden W.',   role: 'AURUM'     as const },
    { id: 'demo-user-2', supabaseId: 'demo-sb-2222-2222-2222-222222222222', email: 'liam@demo.eostrading.com',   fullName: 'Liam B.',    role: 'AURUM'     as const },
    { id: 'demo-user-3', supabaseId: 'demo-sb-3333-3333-3333-333333333333', email: 'sophia@demo.eostrading.com', fullName: 'Sophia L.',  role: 'BOARDROOM' as const },
    { id: 'demo-user-4', supabaseId: 'demo-sb-4444-4444-4444-444444444444', email: 'marcus@demo.eostrading.com', fullName: 'Marcus T.',  role: 'AURUM'     as const },
    { id: 'demo-user-5', supabaseId: 'demo-sb-5555-5555-5555-555555555555', email: 'emma@demo.eostrading.com',   fullName: 'Emma C.',    role: 'STANDARD'  as const },
    { id: 'demo-user-6', supabaseId: 'demo-sb-6666-6666-6666-666666666666', email: 'james@demo.eostrading.com',  fullName: 'James R.',   role: 'STANDARD'  as const },
    { id: 'demo-user-7', supabaseId: 'demo-sb-7777-7777-7777-777777777777', email: 'karen@demo.eostrading.com',  fullName: 'Karen W.',   role: 'AURUM'     as const },
  ]

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    })
  }

  // ─── Demo community posts ─────────────────────────────────────────────────
  const demoPosts = [
    {
      id: 'post-1',
      userId: 'demo-user-1',
      content: 'Just pulled another payout using Aurum on FTMO 100k account. 9-strategy system is absolutely printing right now. Consistency is key guys 💪',
      tag: 'PAYOUT' as const,
      amount: 8613,
      isPinned: true,
    },
    {
      id: 'post-2',
      userId: 'demo-user-3',
      content: 'Passed my Funded Next challenge on the first attempt with Omni EA. Drew down only 3.2% max. Couldn\'t believe how clean the results were. Highly recommend the set files from the downloads section.',
      tag: 'CHALLENGE_PASSED' as const,
      amount: null,
      isPinned: false,
    },
    {
      id: 'post-3',
      userId: 'demo-user-4',
      content: 'Aurum just hit $4,218 payout this month. Running 3 accounts simultaneously now. The Asia session + London overlap is where the magic happens.',
      tag: 'AURUM_RESULTS' as const,
      amount: 4218,
      isPinned: false,
    },
    {
      id: 'post-4',
      userId: 'demo-user-5',
      content: 'Quick question for the community — what prop firms are you guys finding most consistent for passing with Omni? I\'ve tried FTMO and The5%ers so far.',
      tag: 'QUESTION' as const,
      amount: null,
      isPinned: false,
    },
    {
      id: 'post-5',
      userId: 'demo-user-6',
      content: '$1,847 payout received from MyForexFunds today. First payout ever! Been running Omni for 6 weeks. For anyone starting out — trust the process and don\'t touch the settings.',
      tag: 'PAYOUT' as const,
      amount: 1847,
      isPinned: false,
    },
    {
      id: 'post-6',
      userId: 'demo-user-7',
      content: 'Just upgraded to Aurum last week and the difference is night and day. 9 strategies running in parallel vs 1. The diversification alone makes drawdown so much smoother.',
      tag: 'GENERAL' as const,
      amount: null,
      isPinned: false,
    },
    {
      id: 'post-7',
      userId: 'demo-user-2',
      content: 'Monthly Aurum results — $6,782 across 4 prop firm accounts. FTMO, MyForexFunds, True Forex Funds, and E8. The key is spreading risk across firms.',
      tag: 'AURUM_RESULTS' as const,
      amount: 6782,
      isPinned: false,
    },
  ]

  for (const p of demoPosts) {
    await prisma.post.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }

  // ─── Demo leaderboard entries (current month) ─────────────────────────────
  const now = new Date()
  const currentMonth = now.toLocaleString('en-US', { month: 'long' })
  const currentYear = now.getFullYear()

  const leaderboardEntries = [
    { userId: 'demo-user-1', system: 'Aurum', propFirm: 'FTMO',             payout: 8613, month: currentMonth, year: currentYear },
    { userId: 'demo-user-2', system: 'Aurum', propFirm: 'MyForexFunds',     payout: 6782, month: currentMonth, year: currentYear },
    { userId: 'demo-user-3', system: 'Aurum', propFirm: 'True Forex Funds', payout: 5684, month: currentMonth, year: currentYear },
    { userId: 'demo-user-4', system: 'Aurum', propFirm: 'FTMO',             payout: 4218, month: currentMonth, year: currentYear },
    { userId: 'demo-user-5', system: 'Omni',  propFirm: 'FTMO',             payout: 3210, month: currentMonth, year: currentYear },
    { userId: 'demo-user-6', system: 'Omni',  propFirm: 'Funded Next',      payout: 1847, month: currentMonth, year: currentYear },
    { userId: 'demo-user-7', system: 'Aurum', propFirm: 'The5%ers',         payout: 3149, month: currentMonth, year: currentYear },
  ]

  for (const entry of leaderboardEntries) {
    await prisma.leaderboardEntry.upsert({
      where: { userId_month_year: { userId: entry.userId, month: entry.month, year: entry.year } },
      update: { payout: entry.payout, propFirm: entry.propFirm },
      create: entry,
    })
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
