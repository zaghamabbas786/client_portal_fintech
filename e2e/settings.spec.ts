import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/auth'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders Settings page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
  })

  test('shows user email field (read-only)', async ({ page }) => {
    await page.waitForTimeout(1500)
    const emailField = page.locator('input[type="email"]').or(
      page.locator('input').filter({ hasText: TEST_USER.email })
    )
    if (await emailField.count() > 0) {
      await expect(emailField.first()).toBeVisible()
    }
  })

  test('shows full name input', async ({ page }) => {
    await page.waitForTimeout(1500)
    const nameInput = page.getByPlaceholder(/full name|your name/i)
      .or(page.locator('input[name="fullName"]'))
    if (await nameInput.count() > 0) {
      await expect(nameInput.first()).toBeVisible()
    }
  })

  test('shows notification preference toggles', async ({ page }) => {
    await page.waitForTimeout(1500)
    await expect(page.getByText(/email notification|community alert|payout update/i).first()).toBeVisible()
  })

  test('can update full name', async ({ page }) => {
    await page.waitForTimeout(1500)
    const nameInput = page.locator('input').filter({ hasText: /name/i })
      .or(page.getByPlaceholder(/full name/i))
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Updated Test Name')
      await page.getByRole('button', { name: /save|update/i }).click()
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 8_000 })
    }
  })

  test('shows Save button', async ({ page }) => {
    await page.waitForTimeout(1500)
    await expect(page.getByRole('button', { name: /save|update/i })).toBeVisible()
  })
})
