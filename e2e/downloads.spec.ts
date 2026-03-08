import { test, expect } from '@playwright/test'

test.describe('Downloads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/downloads')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders Downloads page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /downloads/i })).toBeVisible()
  })

  test('shows Omni EA files', async ({ page }) => {
    await expect(page.getByText(/omni ea/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows Asia Scalper files', async ({ page }) => {
    await expect(page.getByText(/asia scalper/i).first()).toBeVisible()
  })

  test('shows file type labels (EA File, Setup Guide, Set Files)', async ({ page }) => {
    await expect(page.getByText(/ea file|setup guide|set files|broker settings/i).first()).toBeVisible()
  })

  test('shows version labels on files', async ({ page }) => {
    await expect(page.getByText(/v\d+\.\d+/i).first()).toBeVisible()
  })

  test('shows download buttons', async ({ page }) => {
    const btn = page.getByRole('link', { name: /download/i }).first()
      .or(page.getByRole('button', { name: /download/i }).first())
    await expect(btn).toBeVisible()
  })

  test('Aurum section is locked for Standard users', async ({ page }) => {
    const lockedAurum = page.getByText(/aurum/i).filter({ hasText: /locked|upgrade|unlock/i })
    const aurumLockOverlay = page.locator('[style*="locked"], .locked, [class*="locked"]')
    const hasLock = (await lockedAurum.count() > 0) || (await aurumLockOverlay.count() > 0)
      || (await page.getByText(/upgrade to aurum/i).count() > 0)
    expect(hasLock).toBe(true)
  })

  test('groups files by EA name', async ({ page }) => {
    const groups = await page.getByText(/omni ea|asia scalper/i).count()
    expect(groups).toBeGreaterThanOrEqual(2)
  })
})
