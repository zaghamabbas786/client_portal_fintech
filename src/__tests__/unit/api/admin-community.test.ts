/** @jest-environment node */
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    post: {
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}))

const ADMIN_USER = { id: 'admin-1', supabaseId: 'sb-admin', role: 'ADMIN', email: 'admin@test.com' }
const STD_USER = { id: 'user-1', supabaseId: 'sb-user', role: 'STANDARD', email: 'user@test.com' }

function makeReq(method = 'GET', body?: object) {
  return new NextRequest('http://localhost/api/admin/community/posts', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  })
}

// ── GET /api/admin/community/posts ────────────────────────────────────────────
describe('GET /api/admin/community/posts', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sb-admin' } } })
    mockFindUnique.mockResolvedValue(ADMIN_USER)
    mockFindMany.mockResolvedValue([
      {
        id: 'post-1',
        content: 'Test post',
        tag: 'GENERAL',
        isPinned: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        amount: null,
        imageUrl: null,
        user: { id: 'user-1', fullName: 'Test User', email: 'user@test.com', role: 'STANDARD' },
        _count: { likes: 2, comments: 1 },
      },
    ])
  })

  it('returns posts for admin', async () => {
    const { GET } = await import('@/app/api/admin/community/posts/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.posts).toHaveLength(1)
    expect(data.posts[0].content).toBe('Test post')
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/admin/community/posts/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    mockFindUnique.mockResolvedValue(STD_USER)
    const { GET } = await import('@/app/api/admin/community/posts/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })
})

// ── PATCH /api/admin/community/posts/[id] ────────────────────────────────────
describe('PATCH /api/admin/community/posts/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sb-admin' } } })
    mockFindUnique.mockResolvedValue(ADMIN_USER)
    mockUpdate.mockResolvedValue({
      id: 'post-1',
      isPinned: true,
      content: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      amount: null,
    })
  })

  it('pins a post', async () => {
    const { PATCH } = await import('@/app/api/admin/community/posts/[id]/route')
    const req = new NextRequest('http://localhost/api/admin/community/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ isPinned: true }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'post-1' }) })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: expect.objectContaining({ isPinned: true }),
    })
  })

  it('returns 403 for non-admin', async () => {
    mockFindUnique.mockResolvedValue(STD_USER)
    const { PATCH } = await import('@/app/api/admin/community/posts/[id]/route')
    const req = new NextRequest('http://localhost/api/admin/community/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ isPinned: true }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'post-1' }) })
    expect(res.status).toBe(403)
  })
})

// ── DELETE /api/admin/community/posts/[id] ────────────────────────────────────
describe('DELETE /api/admin/community/posts/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sb-admin' } } })
    mockFindUnique.mockResolvedValue(ADMIN_USER)
    mockDelete.mockResolvedValue({ id: 'post-1' })
  })

  it('deletes a post', async () => {
    const { DELETE } = await import('@/app/api/admin/community/posts/[id]/route')
    const req = new NextRequest('http://localhost/api/admin/community/posts/post-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-1' }) })
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'post-1' } })
  })

  it('returns 403 for non-admin', async () => {
    mockFindUnique.mockResolvedValue(STD_USER)
    const { DELETE } = await import('@/app/api/admin/community/posts/[id]/route')
    const req = new NextRequest('http://localhost/api/admin/community/posts/post-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'post-1' }) })
    expect(res.status).toBe(403)
  })
})
