/**
 * @jest-environment node
 */
import { provisionAccount, getProvisionedAccount, getAccountInformation, getPositions, getDeals, deleteProvisionedAccount } from '@/lib/metaapi'

const originalFetch = global.fetch

beforeEach(() => {
  jest.restoreAllMocks()
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('metaapi', () => {
  const FAKE_TOKEN = 'fake-metaapi-token'
  beforeEach(() => {
    process.env.METAAPI_ACCESS_TOKEN = FAKE_TOKEN
  })
  afterEach(() => {
    delete process.env.METAAPI_ACCESS_TOKEN
  })

  describe('provisionAccount', () => {
    it('throws when METAAPI_ACCESS_TOKEN is not set', async () => {
      delete process.env.METAAPI_ACCESS_TOKEN
      await expect(
        provisionAccount({
          login: '123',
          password: 'pwd',
          server: 'Server-Demo',
          platform: 'mt5',
          name: 'Test',
        })
      ).rejects.toThrow('METAAPI_ACCESS_TOKEN')
    })

    it('sends correct request to provisioning API', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: 'acc-123', state: 'DEPLOYED' }),
      })
      global.fetch = mockFetch

      const result = await provisionAccount({
        login: '50194988',
        password: 'investor123',
        server: 'ICMarketsSC-Demo',
        platform: 'mt5',
        name: 'FTMO Challenge',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/current/accounts'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'auth-token': FAKE_TOKEN,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            login: '50194988',
            password: 'investor123',
            server: 'ICMarketsSC-Demo',
            platform: 'mt5',
            name: 'FTMO Challenge',
            magic: 0,
          }),
        })
      )
      expect(result).toEqual({ id: 'acc-123', state: 'DEPLOYED' })
    })

    it('throws on 202 retry response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        json: async () => ({ message: 'Retry in 60 seconds' }),
      })

      await expect(
        provisionAccount({
          login: '123',
          password: 'pwd',
          server: 'Server',
          platform: 'mt4',
          name: 'Test',
        })
      ).rejects.toThrow(/retry/i)
    })

    it('throws on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid credentials' }),
      })

      await expect(
        provisionAccount({
          login: '123',
          password: 'pwd',
          server: 'Server',
          platform: 'mt5',
          name: 'Test',
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getProvisionedAccount', () => {
    it('returns account with region', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          _id: 'acc-456',
          name: 'My Account',
          login: '50194988',
          server: 'ICMarketsSC-Demo',
          state: 'DEPLOYED',
          region: 'vint-hill',
        }),
      })

      const result = await getProvisionedAccount('acc-456')
      expect(result.name).toBe('My Account')
      expect(result.region).toBe('vint-hill')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/acc-456'),
        expect.any(Object)
      )
    })
  })

  describe('getAccountInformation', () => {
    it('calls trading API with correct region', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: 10000,
          equity: 10150,
          margin: 500,
          freeMargin: 9650,
          leverage: 100,
          marginLevel: 2030,
          currency: 'USD',
          login: 50194988,
          tradeAllowed: true,
        }),
      })

      const result = await getAccountInformation('acc-789', 'vint-hill')
      expect(result.balance).toBe(10000)
      expect(result.equity).toBe(10150)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vint-hill'),
        expect.any(Object)
      )
    })

    it('uses new-york when region not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ balance: 0, equity: 0, margin: 0, freeMargin: 0, leverage: 0, marginLevel: 0, currency: 'USD', login: 0, tradeAllowed: false }),
      })

      await getAccountInformation('acc-1')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('new-york'),
        expect.any(Object)
      )
    })
  })

  describe('getPositions', () => {
    it('returns positions array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 'pos-1', symbol: 'EURUSD', type: 'BUY', volume: 0.1, profit: 50 },
        ],
      })

      const result = await getPositions('acc-1')
      expect(result).toHaveLength(1)
      expect(result[0].symbol).toBe('EURUSD')
      expect(result[0].profit).toBe(50)
    })
  })

  describe('getDeals', () => {
    it('calls with time range', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })

      await getDeals('acc-1', '2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.000Z')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('history-deals/time'),
        expect.any(Object)
      )
    })
  })

  describe('deleteProvisionedAccount', () => {
    it('sends DELETE request', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true })

      await deleteProvisionedAccount('acc-to-delete')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/acc-to-delete'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
