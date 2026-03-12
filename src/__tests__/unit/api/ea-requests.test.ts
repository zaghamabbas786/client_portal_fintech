/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}))

const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
const mockFindMany = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    eARequest: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  },
}))

const makeReq = (method: string, url: string, body?: object): NextRequest =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

const FAKE_AUTH = { id: 'auth-1', email: 'test@test.com' }
const FAKE_PROFILE = { id: 'user-1', supabaseId: 'auth-1', email: 'test@test.com', role: 'STANDARD' }

describe('GET /api/ea-requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockFindMany.mockResolvedValue([])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/ea-requests/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/ea-requests'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when user profile not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/ea-requests/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/ea-requests'))
    expect(res.status).toBe(404)
  })

  it('returns requests array on success', async () => {
    const fakeRequests = [
      { id: 'req-1', eaName: 'Aurum EA', message: 'Please assign', status: 'PENDING', createdAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRequests)
    const { GET } = await import('@/app/api/ea-requests/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/ea-requests'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('requests')
    expect(Array.isArray(json.requests)).toBe(true)
  })
})

describe('POST /api/ea-requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockCreate.mockImplementation((args: { data: { message: string; eaName?: string } }) =>
      Promise.resolve({
        id: 'req-new',
        eaName: args?.data?.eaName ?? null,
        message: args?.data?.message ?? '',
        status: 'PENDING',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/ea-requests/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/ea-requests', { message: 'Need EA' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty message', async () => {
    const { POST } = await import('@/app/api/ea-requests/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/ea-requests', { message: '' }))
    expect(res.status).toBe(400)
  })

  it('creates request and returns 201', async () => {
    const { POST } = await import('@/app/api/ea-requests/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/ea-requests', {
        message: 'I need Aurum EA for my FTMO account',
        eaName: 'Aurum EA',
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('request')
    expect(json.request.message).toBe('I need Aurum EA for my FTMO account')
  })
})
