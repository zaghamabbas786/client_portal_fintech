/**
 * @jest-environment node
 */
// Unit tests for /api/support route logic
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()
const mockCreate = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    supportTicket: { findMany: mockFindMany, create: mockCreate },
  },
}))

const makeReq = (method: string, url: string, body?: object): NextRequest =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

const FAKE_AUTH_USER = { id: 'auth-uuid-1', email: 'test@test.com' }
const FAKE_PROFILE = { id: 'user-db-1', supabaseId: 'auth-uuid-1', email: 'test@test.com', role: 'STANDARD' }
const FAKE_TICKET = {
  id: 'ticket-1',
  subject: 'EA not loading',
  description: 'My EA is not loading on MT4',
  priority: 'MEDIUM',
  status: 'OPEN',
  userId: 'user-db-1',
  createdAt: new Date('2026-03-01T00:00:00Z'),
  updatedAt: new Date('2026-03-01T00:00:00Z'),
  _count: { replies: 0 },
}

describe('GET /api/support', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockFindMany.mockResolvedValue([FAKE_TICKET])
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/support/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/support'))
    expect(res.status).toBe(401)
  })

  it('returns tickets array', async () => {
    const { GET } = await import('@/app/api/support/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/support'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('tickets')
    expect(Array.isArray(json.tickets)).toBe(true)
  })

  it('only returns tickets for the current user', async () => {
    const { GET } = await import('@/app/api/support/route')
    await GET(makeReq('GET', 'http://localhost/api/support'))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: FAKE_PROFILE.id },
      })
    )
  })
})

describe('POST /api/support', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockCreate.mockResolvedValue(FAKE_TICKET)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/support/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/support', { subject: 'Help', description: 'I need help', priority: 'MEDIUM' })
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing subject', async () => {
    const { POST } = await import('@/app/api/support/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/support', { description: 'desc', priority: 'MEDIUM' })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing description', async () => {
    const { POST } = await import('@/app/api/support/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/support', { subject: 'Help', priority: 'MEDIUM' })
    )
    expect(res.status).toBe(400)
  })

  it('creates ticket with correct priority and user', async () => {
    const { POST } = await import('@/app/api/support/route')
    await POST(
      makeReq('POST', 'http://localhost/api/support', {
        subject: 'EA not loading',
        description: 'My EA is not loading on MT4',
        priority: 'HIGH',
      })
    )
    // status:'OPEN' is set by Prisma schema default, not passed explicitly
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priority: 'HIGH', userId: FAKE_PROFILE.id }),
      })
    )
  })

  it('returns 201 on success', async () => {
    const { POST } = await import('@/app/api/support/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/support', {
        subject: 'EA not loading',
        description: 'My EA is not loading on MT4',
        priority: 'MEDIUM',
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('ticket')
  })
})
