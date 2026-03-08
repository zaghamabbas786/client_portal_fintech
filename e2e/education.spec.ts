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
    // Use button role to avoid strict mode issues (text also appears in video titles/tags)
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
    // Use role=button to avoid strict mode — "Risk Management" also appears in video titles/tags
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

  test('shows play icon or button on videos', async ({ page }) => {
    const playBtn = page.locator('button, a').filter({ has: page.locator('svg') }).first()
    await expect(playBtn).toBeVisible()
  })
})
