import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local so TEST_USER_EMAIL / TEST_USER_PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || config.projects[0].use.baseURL || 'http://localhost:3000'
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local')
  }

  // Ensure auth directory exists
  const authDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  console.log(`\n🔐 Global setup: logging in as ${email}...`)
  await page.goto(`${baseURL}/login`)

  // Wait for Suspense boundary to resolve and show the form
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 30_000 })

  await page.fill('input[placeholder="you@example.com"]', email)
  await page.fill('input[type="password"]', password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 60_000 })

  // Save authenticated session for all tests to reuse
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
  console.log('✅ Global setup: session saved — all tests will reuse this login\n')

  await browser.close()
}

export default globalSetup
