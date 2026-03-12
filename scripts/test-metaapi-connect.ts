/**
 * Test MetaApi connection.
 *
 * Mode 1 - Existing account (deploy + fetch):
 *   METAAPI_ACCOUNT_ID=xxx npx tsx scripts/test-metaapi-connect.ts
 *
 * Mode 2 - Provision new account:
 *   MT_LOGIN=... MT_PASSWORD=... MT_SERVER=... npx tsx scripts/test-metaapi-connect.ts
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const existingAccountId = process.env.METAAPI_ACCOUNT_ID
const findByLogin = process.env.METAAPI_FIND_LOGIN // e.g. 1512753485
const login = process.env.MT_LOGIN || '1000764'
const password = process.env.MT_PASSWORD || '*0EmQxWk'
const server = process.env.MT_SERVER || 'TTTMarketsLtd'
const platform = (process.env.MT_PLATFORM || 'mt5') as 'mt4' | 'mt5'

async function main() {
  const token = process.env.METAAPI_ACCESS_TOKEN
  if (!token) {
    console.error('❌ METAAPI_ACCESS_TOKEN not set in .env.local')
    process.exit(1)
  }

  try {
    const {
      provisionAccount,
      getProvisionedAccount,
      getAccountInformation,
      deployAccount,
      listProvisionedAccounts,
    } = await import('../src/lib/metaapi')

    let accountId: string | undefined
    let region = 'london'

    if (findByLogin) {
      console.log(`\n🔍 Finding account by login: ${findByLogin}...`)
      const accounts = await listProvisionedAccounts()
      const found = accounts.find((a) => String(a.login) === String(findByLogin))
      if (!found) {
        console.error(`❌ No account found with login ${findByLogin}`)
        console.log('   Available:', accounts.map((a) => ({ id: a.id, login: a.login, name: a.name })))
        process.exit(1)
      }
      accountId = found.id
      console.log(`   Found: ${found.name} (${accountId})`)
    } else if (existingAccountId) {
      accountId = existingAccountId
    }

    if (accountId) {
      console.log('\n🔌 Testing existing MetaApi account...')
      console.log(`   Account ID: ${accountId}`)

      const provisioned = await getProvisionedAccount(accountId)
      region = provisioned.region ?? 'london'
      console.log(`   State: ${provisioned.state}, Region: ${region}`)

      if (provisioned.state === 'UNDEPLOYED') {
        console.log('\n2. Deploying account...')
        await deployAccount(accountId)
        console.log('   ✅ Deployed')
        console.log('3. Waiting 20s for connection...')
        await new Promise((r) => setTimeout(r, 20000))
      }

      console.log('\n4. Fetching account information...')
      const info = await getAccountInformation(accountId, region)
      console.log(`   ✅ Balance: ${info.currency} ${info.balance}`)
      console.log(`   ✅ Equity: ${info.equity}`)
      console.log(`   ✅ Broker: ${info.broker || 'N/A'}`)
    } else {
      console.log('\n🔌 Provisioning new account...')
      console.log(`   Login: ${login}, Server: ${server}, Platform: ${platform}`)

      const result = await provisionAccount({
        login,
        password,
        server,
        platform,
        name: `Test ${login}`,
      })
      accountId = result.id
      console.log(`   ✅ Provisioned: ${accountId}`)

      const provisioned = await getProvisionedAccount(accountId)
      region = provisioned.region ?? 'new-york'
      console.log('   Waiting 15s for connection...')
      await new Promise((r) => setTimeout(r, 15000))

      const info = await getAccountInformation(accountId, region)
      console.log(`   ✅ Balance: ${info.currency} ${info.balance}`)
      console.log(`   ✅ Equity: ${info.equity}`)
    }

    console.log('\n✅ MetaApi connection successful!\n')
  } catch (err) {
    console.error('\n❌ Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
