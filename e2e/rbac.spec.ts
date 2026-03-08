import { test, expect } from '@playwright/test'

/**
 * Role-Based Access Control tests.
 * Standard User tests use the global storageState (already logged in).
 * Unauthenticated tests override storageState to test with no session.
 */

test.describe('RBAC — Standard User', () => {
  test('Portfolio page shows locked/upgrade state for Standard', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText(/upgrade|locked|aurum|unlock/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/total pnl|equity curve|open trades/i)).not.toBeVisible()
  })

  test('Aurum EA is locked in My EAs', async ({ page }) => {
    await page.goto('/my-eas')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText(/locked|upgrade/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('Aurum downloads are locked in Downloads', async ({ page }) => {
    await page.goto('/downloads')
    await page.waitForLoadState('domcontentloaded')
    const lockedEls = page.getByText(/upgrade|locked|aurum member/i)
    await expect(lockedEls.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Admin routes are inaccessible to Standard users', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin/, { timeout: 10_000 })
  })

  test('Sidebar does not show Admin link for Standard users', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /^admin$/i })).not.toBeVisible()
  })

  test('Boardroom commission rate not shown for Standard', async ({ page }) => {
    await page.goto('/referrals')
    await expect(page.getByText(/30%/)).not.toBeVisible()
    await expect(page.getByText(/15%/)).toBeVisible()
  })
})

test.describe('RBAC — Unauthenticated', () => {
  // Override global storageState — these tests need no session
  test.use({ storageState: { cookies: [], origins: [] } })

  const protectedRoutes = [
    '/dashboard',
    '/community',
    '/leaderboard',
    '/my-eas',
    '/downloads',
    '/education',
    '/support',
    '/referrals',
    '/settings',
    '/portfolio',
    '/admin',
  ]

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    })
  }
})
