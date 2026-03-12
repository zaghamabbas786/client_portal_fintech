/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()
const mockMTFindUnique = jest.fn()
const mockCreate = jest.fn()
const mockFindFirst = jest.fn()
const mockDelete = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    mTAccount: {
      findMany: mockFindMany,
      findUnique: mockMTFindUnique,
      findFirst: mockFindFirst,
      create: mockCreate,
      delete: mockDelete,
    },
  },
}))

jest.mock('@/lib/metaapi', () => ({
  provisionAccount: jest.fn(),
  getProvisionedAccount: jest.fn(),
  getAccountInformation: jest.fn(),
  getPositions: jest.fn(),
  getDeals: jest.fn(),
  deleteProvisionedAccount: jest.fn(),
}))

const makeReq = (method: string, url: string, body?: object): NextRequest =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

const FAKE_AUTH = { id: 'auth-1', email: 'aurum@test.com' }
const AURUM_PROFILE = { id: 'user-1', supabaseId: 'auth-1', email: 'aurum@test.com', role: 'AURUM' }
const STANDARD_PROFILE = { id: 'user-2', supabaseId: 'auth-2', email: 'std@test.com', role: 'STANDARD' }

describe('GET /api/portfolio/accounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(AURUM_PROFILE)
    mockFindMany.mockResolvedValue([])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/portfolio/accounts/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/portfolio/accounts'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when user profile not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/portfolio/accounts/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/portfolio/accounts'))
    expect(res.status).toBe(404)
  })

  it('returns 403 for Standard user', async () => {
    mockFindUnique.mockResolvedValue(STANDARD_PROFILE)
    const { GET } = await import('@/app/api/portfolio/accounts/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/portfolio/accounts'))
    expect(res.status).toBe(403)
  })

  it('returns accounts array for Aurum user', async () => {
    const fakeAccounts = [
      { id: 'acc-1', login: '50194988', server: 'ICMarkets', platform: 'mt5', name: 'FTMO' },
    ]
    mockFindMany.mockResolvedValue(fakeAccounts)
    const { GET } = await import('@/app/api/portfolio/accounts/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/portfolio/accounts'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('accounts')
    expect(json.accounts).toEqual(fakeAccounts)
  })
})

describe('POST /api/portfolio/accounts', () => {
  const validBody = {
    login: '50194988',
    password: 'investor123',
    server: 'ICMarketsSC-Demo',
    platform: 'mt5' as const,
    name: 'FTMO Challenge',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(AURUM_PROFILE)
    mockMTFindUnique.mockResolvedValue(null)
    process.env.METAAPI_ACCESS_TOKEN = 'fake-token'
    const metaapi = require('@/lib/metaapi')
    metaapi.provisionAccount.mockResolvedValue({ id: 'meta-acc-1', state: 'DEPLOYED' })
    metaapi.getProvisionedAccount.mockResolvedValue({ region: 'vint-hill' })
    mockCreate.mockResolvedValue({
      id: 'db-acc-1',
      metaApiAccountId: 'meta-acc-1',
      login: '50194988',
      server: 'ICMarketsSC-Demo',
      platform: 'mt5',
      name: 'FTMO Challenge',
      region: 'vint-hill',
    })
  })

  afterEach(() => {
    delete process.env.METAAPI_ACCESS_TOKEN
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/portfolio/accounts', validBody))
    expect(res.status).toBe(401)
  })

  it('returns 403 for Standard user', async () => {
    mockFindUnique.mockResolvedValue(STANDARD_PROFILE)
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/portfolio/accounts', validBody))
    expect(res.status).toBe(403)
  })

  it('returns 503 when METAAPI_ACCESS_TOKEN not set', async () => {
    delete process.env.METAAPI_ACCESS_TOKEN
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/portfolio/accounts', validBody))
    expect(res.status).toBe(503)
  })

  it('returns 400 for invalid payload', async () => {
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/portfolio/accounts', {
        login: '',
        password: 'pwd',
        server: 'srv',
        platform: 'mt5',
        name: 'x',
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid platform', async () => {
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/portfolio/accounts', {
        ...validBody,
        platform: 'mt6',
      })
    )
    expect(res.status).toBe(400)
  })

  it('creates account and returns 201 on success', async () => {
    mockMTFindUnique.mockResolvedValue(null)
    const { POST } = await import('@/app/api/portfolio/accounts/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/portfolio/accounts', validBody))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('account')
    expect(json.account.login).toBe('50194988')
  })
})

describe('DELETE /api/portfolio/accounts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(AURUM_PROFILE)
    mockFindFirst.mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      metaApiAccountId: 'meta-acc-1',
    })
    mockDelete.mockResolvedValue({})
    const metaapi = require('@/lib/metaapi')
    metaapi.deleteProvisionedAccount.mockResolvedValue(undefined)
  })

  it('returns 404 when account not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const { DELETE } = await import('@/app/api/portfolio/accounts/[id]/route')
    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/portfolio/accounts/acc-1'),
      { params: Promise.resolve({ id: 'acc-1' }) }
    )
    expect(res.status).toBe(404)
  })

  it('deletes account and returns 200', async () => {
    const { DELETE } = await import('@/app/api/portfolio/accounts/[id]/route')
    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/portfolio/accounts/acc-1'),
      { params: Promise.resolve({ id: 'acc-1' }) }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })
})

describe('GET /api/portfolio/accounts/[id]/state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(AURUM_PROFILE)
    mockFindFirst.mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      metaApiAccountId: 'meta-acc-1',
      region: 'vint-hill',
    })
    process.env.METAAPI_ACCESS_TOKEN = 'fake-token'
    const metaapi = require('@/lib/metaapi')
    metaapi.getAccountInformation.mockResolvedValue({
      balance: 10000,
      equity: 10150,
      margin: 500,
      freeMargin: 9650,
      leverage: 100,
      marginLevel: 2030,
      currency: 'USD',
      broker: 'ICMarkets',
      login: 50194988,
      tradeAllowed: true,
    })
    metaapi.getPositions.mockResolvedValue([])
    metaapi.getDeals.mockResolvedValue([])
  })

  afterEach(() => {
    delete process.env.METAAPI_ACCESS_TOKEN
  })

  it('returns 403 for Standard user', async () => {
    mockFindUnique.mockResolvedValue(STANDARD_PROFILE)
    mockFindFirst.mockResolvedValue(null)
    const { GET } = await import('@/app/api/portfolio/accounts/[id]/state/route')
    const res = await GET(
      makeReq('GET', 'http://localhost/api/portfolio/accounts/acc-1/state'),
      { params: Promise.resolve({ id: 'acc-1' }) }
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 when account not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const { GET } = await import('@/app/api/portfolio/accounts/[id]/state/route')
    const res = await GET(
      makeReq('GET', 'http://localhost/api/portfolio/accounts/acc-1/state'),
      { params: Promise.resolve({ id: 'acc-1' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns account state on success', async () => {
    const { GET } = await import('@/app/api/portfolio/accounts/[id]/state/route')
    const res = await GET(
      makeReq('GET', 'http://localhost/api/portfolio/accounts/acc-1/state'),
      { params: Promise.resolve({ id: 'acc-1' }) }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('info')
    expect(json.info.balance).toBe(10000)
    expect(json.info.equity).toBe(10150)
    expect(json).toHaveProperty('positions')
    expect(json).toHaveProperty('recentDeals')
  })
})
