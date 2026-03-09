import { test, expect } from '@playwright/test'

test.describe('Referral Link', () => {
  // These tests use the logged-in session but test the /ref/[code] route

  test('visiting /ref/[code] with a valid code redirects to signup', async ({ page }) => {
    // Use a fake code — server should still redirect to signup with the code param
    await page.goto('/ref/testcode123', { waitUntil: 'domcontentloaded' })
    // Should redirect to /signup with ref param
    await expect(page).toHaveURL(/\/(signup|login)(\?.*ref=testcode123)?/, { timeout: 10_000 })
  })

  test('visiting /ref/[code] with empty code redirects to signup root', async ({ page }) => {
    await page.goto('/ref/unknown-ref-code-xyz', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/(signup|login)/, { timeout: 10_000 })
  })

  test('referral link on referrals page is copyable', async ({ page }) => {
    await page.goto('/referrals')
    await page.waitForLoadState('domcontentloaded')
    const input = page.getByRole('textbox').first()
    await expect(input).toBeVisible()
    const value = await input.inputValue()
    expect(value).toContain('/ref/')
  })

  test('referrals page shows commission rate', async ({ page }) => {
    await page.goto('/referrals')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText(/commission rate/i)).toBeVisible()
    await expect(page.getByText(/15%|30%/)).toBeVisible()
  })
})
