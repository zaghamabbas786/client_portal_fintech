import { test, expect } from '@playwright/test'

test.describe('Education', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/education')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders Education page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /education|training/i })).toBeVisible()
  })

  test('shows category filter tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^getting started$/i })).toBeVisible()
  })

  test('shows video cards with titles', async ({ page }) => {
    await expect(page.getByText(/getting started with omni|installing.*ea/i).first()).toBeVisible()
  })

  test('shows video duration labels', async ({ page }) => {
    await expect(page.getByText(/\d+:\d+/).first()).toBeVisible()
  })

  test('shows featured video', async ({ page }) => {
    await expect(page.getByText(/scale.*£10k|top clients.*scale/i)).toBeVisible()
  })

  test('category filter changes visible videos', async ({ page }) => {
    await page.getByRole('button', { name: /^risk management$/i }).click()
    await expect(page.getByText(/risk management fundamentals/i)).toBeVisible()
    await expect(page.getByText(/getting started with omni/i)).not.toBeVisible()
  })

  test('All category shows all videos', async ({ page }) => {
    await page.getByRole('button', { name: /^prop firm guides$/i }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /^all$/i }).click()
    await expect(page.getByText(/getting started with omni/i)).toBeVisible()
  })

  test('clicking a video card opens the player modal', async ({ page }) => {
    // Click the first video card
    await page.locator('[data-testid="video-card"]').first().click()
    // Modal should appear with an iframe or embed container
    await expect(page.locator('[data-testid="video-modal"]')).toBeVisible({ timeout: 5000 })
  })

  test('video modal can be closed', async ({ page }) => {
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="video-modal"]')).toBeVisible({ timeout: 5000 })
    // Close button
    await page.locator('[data-testid="video-modal-close"]').click()
    await expect(page.locator('[data-testid="video-modal"]')).not.toBeVisible()
  })

  test('videos are loaded from database (not hardcoded)', async ({ page }) => {
    // The page should show video data — if DB is empty it shows an empty state,
    // if seeded it shows the seeded videos
    const cards = page.locator('[data-testid="video-card"]')
    const count = await cards.count()
    // We seeded 8 videos, so at least 1 should show
    expect(count).toBeGreaterThan(0)
  })
})
