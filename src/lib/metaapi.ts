/**
 * MetaApi integration for MT4/MT5 account provisioning and trading data.
 * Docs: https://metaapi.cloud/docs/
 */

const PROVISIONING_BASE = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai'

function getToken(): string {
  const token = process.env.METAAPI_ACCESS_TOKEN
  if (!token) throw new Error('METAAPI_ACCESS_TOKEN is not set')
  return token
}

function randomTransactionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Add MT account to MetaApi cloud. Returns account id on success. */
export async function provisionAccount(params: {
  login: string
  password: string
  server: string
  platform: 'mt4' | 'mt5'
  name: string
  magic?: number
  provisioningProfileId?: string
  reliability?: 'regular' | 'high'
}): Promise<{ id: string; state: string }> {
  const token = getToken()
  const transactionId = randomTransactionId()
  const profileId = params.provisioningProfileId ?? process.env.METAAPI_PROVISIONING_PROFILE_ID
  const reliability = params.reliability ?? (process.env.METAAPI_RELIABILITY as 'regular' | 'high') ?? 'regular'

  const body: Record<string, unknown> = {
    login: params.login,
    password: params.password,
    server: params.server,
    name: params.name,
    magic: params.magic ?? 0,
    reliability,
  }
  if (profileId) {
    body.provisioningProfileId = profileId
  } else {
    body.platform = params.platform
  }

  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': token,
      'transaction-id': transactionId,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message ?? data.error ?? `MetaApi error ${res.status}`
    throw new Error(msg)
  }
  if (data.message && res.status === 202) {
    throw new Error(data.message + ' (retry later)')
  }
  return { id: data.id, state: data.state ?? 'DEPLOYED' }
}

/** List accounts in MetaApi for the token. */
export async function listProvisionedAccounts(): Promise<
  { id: string; name: string; login: string; server: string; platform: string; state: string }[]
> {
  const token = getToken()
  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts`, {
    headers: { 'auth-token': token },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `MetaApi error ${res.status}`)
  const raw = data.accounts ?? data ?? []
  const accounts = Array.isArray(raw) ? raw : []
  return accounts.map((a: { _id?: string; id?: string; name?: string; login?: string; server?: string; platform?: string; state?: string }) => ({
    id: (a._id ?? a.id) ?? '',
    name: a.name ?? '',
    login: String(a.login ?? ''),
    server: a.server ?? '',
    platform: a.platform ?? '',
    state: a.state ?? '',
  }))
}

/** Get account by id from provisioning API. */
export async function getProvisionedAccount(accountId: string): Promise<{
  _id?: string
  id?: string
  name: string
  login: string
  server: string
  platform?: string
  state: string
  connectionStatus?: string
  region?: string
}> {
  const token = getToken()
  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    headers: { 'auth-token': token },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `MetaApi error ${res.status}`)
  return { ...data, id: data._id ?? data.id }
}

/** Deploy account (start API server and trading terminal). No-op if already deployed. */
export async function deployAccount(accountId: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts/${accountId}/deploy`, {
    method: 'POST',
    headers: { 'auth-token': token },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message ?? `MetaApi error ${res.status}`)
  }
}

/** Delete account from MetaApi. */
export async function deleteProvisionedAccount(accountId: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    method: 'DELETE',
    headers: { 'auth-token': token },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message ?? `MetaApi error ${res.status}`)
  }
}

/** Trading API base URL by region. */
function getTradingApiBase(region?: string): string {
  const r = region || 'london'
  return `https://mt-client-api-v1.${r}.agiliumtrade.ai`
}

/** Get account information (balance, equity, etc.) from trading API. */
export async function getAccountInformation(
  accountId: string,
  region?: string
): Promise<{
  balance: number
  equity: number
  margin: number
  freeMargin: number
  leverage: number
  marginLevel: number
  broker?: string
  name?: string
  login: number
  currency: string
  tradeAllowed: boolean
}> {
  const token = getToken()
  const base = getTradingApiBase(region)
  const res = await fetch(
    `${base}/users/current/accounts/${accountId}/account-information?refreshTerminalState=true`,
    { headers: { 'auth-token': token } }
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `MetaApi error ${res.status}`)
  return data
}

/** Get open positions. */
export async function getPositions(
  accountId: string,
  region?: string
): Promise<
  {
    id: string
    symbol: string
    type: string
    volume: number
    openPrice: number
    currentPrice: number
    profit: number
    swap: number
    commission: number
  }[]
> {
  const token = getToken()
  const base = getTradingApiBase(region)
  const res = await fetch(
    `${base}/users/current/accounts/${accountId}/positions?refreshTerminalState=true`,
    { headers: { 'auth-token': token } }
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `MetaApi error ${res.status}`)
  return Array.isArray(data) ? data : []
}

/** Get history deals (trades) for time range. */
export async function getDeals(
  accountId: string,
  startTime: string,
  endTime: string,
  region?: string
): Promise<
  {
    id: string
    symbol: string
    type: string
    volume: number
    price: number
    profit: number
    swap: number
    commission: number
    time: string
    brokerTime: string
  }[]
> {
  const token = getToken()
  const base = getTradingApiBase(region)
  const res = await fetch(
    `${base}/users/current/accounts/${accountId}/history-deals/time/${startTime}/${endTime}?limit=500`,
    { headers: { 'auth-token': token } }
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `MetaApi error ${res.status}`)
  return Array.isArray(data) ? data : []
}
