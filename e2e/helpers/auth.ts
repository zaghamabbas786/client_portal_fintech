import { Page } from '@playwright/test'

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@eostrading.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@eostrading.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
}

/**
 * Log in via the UI. Used only in auth tests — all other tests
 * use the pre-saved session from global-setup (storageState).
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 40_000 })
}

/**
 * Log out via the sidebar sign-out button.
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /sign out/i }).click()
  await page.waitForURL('**/login', { timeout: 10_000 })
}
