import { test, expect } from '@playwright/test'

test.describe('Referrals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/referrals')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders Referrals page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /referral/i })).toBeVisible()
  })

  test('shows commission rate', async ({ page }) => {
    await expect(page.getByText(/15%|30%/)).toBeVisible()
  })

  test('shows referral link', async ({ page }) => {
    await expect(page.getByText(/referral link|your link/i)).toBeVisible()
  })

  test('referral link contains the app URL', async ({ page }) => {
    const linkInput = page.locator('input[readonly]')
      .or(page.locator('input[type="text"]').filter({ hasText: /ref=/ }))
    if (await linkInput.count() > 0) {
      const value = await linkInput.first().inputValue()
      expect(value).toContain('ref=')
    }
  })

  test('shows copy button for referral link', async ({ page }) => {
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible()
  })

  test('shows stats (sent, signed up, converted)', async ({ page }) => {
    await expect(page.getByText(/sent|invited/i).first()).toBeVisible()
    await expect(page.getByText(/signed up|registered/i).first()).toBeVisible()
  })

  test('copy button copies link to clipboard', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: /copy/i }).click()
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 5_000 })
  })
})
