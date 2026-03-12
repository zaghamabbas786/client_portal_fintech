import { test, expect } from '@playwright/test'

/**
 * Portfolio (Phase 2 — MetaApi) E2E tests.
 * Default user (TEST_USER) is Standard — sees locked/upgrade state.
 * Aurum/Boardroom users would see Connect Account and analytics (requires TEST_AURUM_USER).
 */

test.describe('Portfolio — Standard User', () => {
  test('Portfolio page shows locked state with upgrade CTA', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText(/portfolio analytics|connect your mt4|mt5 accounts/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/upgrade|aurum|boardroom|unlock/i).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('link', { name: /talk to gio about upgrading/i })).toBeVisible()
  })

  test('Portfolio does not show Connect Account button for Standard', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('button', { name: /connect account/i })).not.toBeVisible()
  })

  test('Portfolio API returns 403 for Standard user', async ({ request }) => {
    const res = await request.get('/api/portfolio/accounts')
    expect(res.status()).toBe(403)
  })
})

test.describe('Portfolio — Page structure', () => {
  test('Portfolio page has correct heading', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { level: 1, name: /portfolio/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Portfolio is linked from sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    const portfolioLink = page.getByRole('link', { name: /portfolio/i })
    await expect(portfolioLink).toBeVisible()
    await portfolioLink.click()
    await expect(page).toHaveURL(/\/portfolio/)
  })
})
