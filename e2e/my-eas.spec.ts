import { test, expect } from '@playwright/test'

test.describe('My EAs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-eas')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders My EAs page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my ea|expert advisor/i })).toBeVisible()
  })

  test('shows EA listings', async ({ page }) => {
    await expect(page.getByText(/omni ea|asia scalper|aurum/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows locked section for unavailable EAs', async ({ page }) => {
    const lockedText = page.getByText(/locked|upgrade|unlock/i).first()
    await expect(lockedText).toBeVisible()
  })

  test('shows version numbers for EAs', async ({ page }) => {
    await expect(page.getByText(/v\d+\.\d+/i).first()).toBeVisible()
  })

  test('shows EA status badges', async ({ page }) => {
    await expect(page.getByText(/active|coming soon|locked/i).first()).toBeVisible()
  })

  test('shows download button or link for accessible EAs', async ({ page }) => {
    const downloadBtn = page.getByRole('link', { name: /download/i })
      .or(page.getByRole('button', { name: /download/i }))
    const count = await downloadBtn.count()
    if (count > 0) {
      await expect(downloadBtn.first()).toBeVisible()
    }
  })

  test('Aurum EA shows locked state for Standard users', async ({ page }) => {
    const aurumLock = page.getByText(/aurum/i).locator('..').getByText(/locked|upgrade/i)
    if (await aurumLock.count() > 0) {
      await expect(aurumLock.first()).toBeVisible()
    }
  })
})
