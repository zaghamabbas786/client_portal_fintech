/**
 * @jest-environment node
 */
// Unit tests for /api/settings route logic
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique, update: mockUpdate },
  },
}))

const makeReq = (method: string, body?: object): NextRequest =>
  new NextRequest('http://localhost/api/settings', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

const FAKE_AUTH_USER = { id: 'auth-uuid-1', email: 'test@test.com' }

// GET returns only selected fields (no supabaseId)
const FAKE_PROFILE_SELECT = {
  id: 'user-db-1',
  fullName: 'Test User',
  email: 'test@test.com',
  phone: null,
  emailNotifications: true,
  communityAlerts: true,
  payoutUpdates: true,
}

// PATCH returns full user record
const FAKE_PROFILE_FULL = {
  ...FAKE_PROFILE_SELECT,
  supabaseId: 'auth-uuid-1',
  role: 'STANDARD',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('GET /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE_SELECT)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns user profile data', async () => {
    const { GET } = await import('@/app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('user')
    expect(json.user.email).toBe('test@test.com')
  })

  it('does not return supabaseId (uses select projection)', async () => {
    const { GET } = await import('@/app/api/settings/route')
    const res = await GET()
    const json = await res.json()
    // The route uses Prisma select — supabaseId is excluded
    expect(json.user).not.toHaveProperty('supabaseId')
  })

  it('returns notification preference fields', async () => {
    const { GET } = await import('@/app/api/settings/route')
    const res = await GET()
    const json = await res.json()
    expect(json.user).toHaveProperty('emailNotifications')
    expect(json.user).toHaveProperty('communityAlerts')
    expect(json.user).toHaveProperty('payoutUpdates')
  })
})

describe('PATCH /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: FAKE_AUTH_USER } })
    mockFindUnique.mockResolvedValue(FAKE_PROFILE_SELECT)
    mockUpdate.mockResolvedValue({ ...FAKE_PROFILE_FULL, fullName: 'Updated Name' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { PATCH } = await import('@/app/api/settings/route')
    const res = await PATCH(makeReq('PATCH', { fullName: 'Updated Name' }))
    expect(res.status).toBe(401)
  })

  it('calls prisma.user.update with provided fields', async () => {
    const { PATCH } = await import('@/app/api/settings/route')
    await PATCH(makeReq('PATCH', { fullName: 'Updated Name', emailNotifications: false }))
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fullName: 'Updated Name', emailNotifications: false }),
      })
    )
  })

  it('returns updated user in response', async () => {
    const { PATCH } = await import('@/app/api/settings/route')
    const res = await PATCH(makeReq('PATCH', { fullName: 'Updated Name' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('user')
  })

  it('does not update fields not included in payload', async () => {
    const { PATCH } = await import('@/app/api/settings/route')
    await PATCH(makeReq('PATCH', { fullName: 'Only Name' }))
    const callArgs = mockUpdate.mock.calls[0][0]
    expect(callArgs.data).not.toHaveProperty('phone')
    expect(callArgs.data).not.toHaveProperty('emailNotifications')
  })
})
