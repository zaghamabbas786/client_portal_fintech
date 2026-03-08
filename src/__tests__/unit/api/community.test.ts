/**
 * @jest-environment node
 */
// Unit tests for /api/community — mocks Prisma and Supabase, no real DB calls
import { NextRequest } from 'next/server'

// ─── Mocks ────────────────────────────────────────────────────────────────────
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
    post: { findMany: mockFindMany, create: mockCreate },
  },
}))

const makeReq = (method: string, url: string, body?: object): NextRequest =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FAKE_AUTH_USER = { id: 'auth-uuid-1', email: 'test@test.com' }
const FAKE_PROFILE = { id: 'user-db-1', supabaseId: 'auth-uuid-1', email: 'test@test.com', role: 'STANDARD' }
const FAKE_POST = {
  id: 'post-1',
  content: 'Test post',
  tag: 'GENERAL',
  amount: null,
  isPinned: false,
  imageUrl: null,
  createdAt: new Date('2026-03-01T00:00:00Z'),
  updatedAt: new Date('2026-03-01T00:00:00Z'),
  userId: 'user-db-1',
  user: { id: 'user-db-1', fullName: 'Test User', email: 'test@test.com', role: 'STANDARD' },
  _count: { likes: 0, comments: 0 },
  likes: [],
}

// ─── GET /api/community ───────────────────────────────────────────────────────
describe('GET /api/community', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockFindMany.mockResolvedValue([FAKE_POST])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/community/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/community'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when user profile not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/community'))
    expect(res.status).toBe(404)
  })

  it('returns posts array on success', async () => {
    const { GET } = await import('@/app/api/community/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/community'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('posts')
    expect(Array.isArray(json.posts)).toBe(true)
  })

  it('passes tag filter to prisma query', async () => {
    const { GET } = await import('@/app/api/community/route')
    await GET(makeReq('GET', 'http://localhost/api/community?tag=PAYOUT'))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tag: 'PAYOUT' } })
    )
  })

  it('converts amount Decimal to string in response', async () => {
    mockFindMany.mockResolvedValue([
      { ...FAKE_POST, amount: { toString: () => '1234.56' } },
    ])
    const { GET } = await import('@/app/api/community/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/community'))
    const json = await res.json()
    expect(typeof json.posts[0].amount).toBe('string')
    expect(json.posts[0].amount).toBe('1234.56')
  })

  it('marks isLiked true when user has liked', async () => {
    mockFindMany.mockResolvedValue([
      { ...FAKE_POST, likes: [{ id: 'like-1' }] },
    ])
    const { GET } = await import('@/app/api/community/route')
    const res = await GET(makeReq('GET', 'http://localhost/api/community'))
    const json = await res.json()
    expect(json.posts[0].isLiked).toBe(true)
  })
})

// ─── POST /api/community ──────────────────────────────────────────────────────
describe('POST /api/community', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE)
    mockCreate.mockResolvedValue({
      ...FAKE_POST,
      content: 'New post',
      tag: 'GENERAL',
      _count: { likes: 0, comments: 0 },
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/community/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/community', { content: 'x', tag: 'GENERAL' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload', async () => {
    const { POST } = await import('@/app/api/community/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/community', { content: '', tag: 'GENERAL' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid tag', async () => {
    const { POST } = await import('@/app/api/community/route')
    const res = await POST(makeReq('POST', 'http://localhost/api/community', { content: 'hello', tag: 'INVALID_TAG' }))
    expect(res.status).toBe(400)
  })

  it('creates post and returns 201', async () => {
    const { POST } = await import('@/app/api/community/route')
    const res = await POST(
      makeReq('POST', 'http://localhost/api/community', { content: 'New post', tag: 'GENERAL' })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('post')
    expect(json.post.isLiked).toBe(false)
  })

  it('stores amount when tag is PAYOUT', async () => {
    const { POST } = await import('@/app/api/community/route')
    await POST(
      makeReq('POST', 'http://localhost/api/community', { content: 'Payout!', tag: 'PAYOUT', amount: '5000' })
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 5000 }),
      })
    )
  })
})
