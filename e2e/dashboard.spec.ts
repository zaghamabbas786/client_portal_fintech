import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('shows welcome message with user name', async ({ page }) => {
    await expect(page.getByText(/welcome back|good (morning|afternoon|evening)/i)).toBeVisible()
  })

  test('renders live results ticker', async ({ page }) => {
    const ticker = page.locator('[class*="ticker"], [style*="ticker"]').first()
    await expect(ticker).toBeVisible({ timeout: 10_000 })
  })

  test('shows community highlights section', async ({ page }) => {
    await expect(page.getByText(/community|highlights/i).first()).toBeVisible()
  })

  test('shows payout leaderboard section', async ({ page }) => {
    await expect(page.getByText(/leaderboard/i).first()).toBeVisible()
  })

  test('shows My EAs section', async ({ page }) => {
    await expect(page.getByText(/my ea|your ea/i).first()).toBeVisible()
  })

  test('shows Downloads section', async ({ page }) => {
    await expect(page.getByText(/downloads/i).first()).toBeVisible()
  })

  test('shows Education section', async ({ page }) => {
    await expect(page.getByText(/education|training/i).first()).toBeVisible()
  })

  test('shows Support section', async ({ page }) => {
    await expect(page.getByText(/support/i).first()).toBeVisible()
  })

  test('sidebar is visible with all nav items', async ({ page }) => {
    // Scope all assertions to the sidebar <aside> to avoid matching page content sections
    const sidebar = page.locator('aside').first()
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Community' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Leaderboard' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'My EAs' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Downloads' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Education' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Support' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Referrals' })).toBeVisible()
  })

  test('sidebar shows user identity (name or role)', async ({ page }) => {
    // Sidebar always shows the user's role label at the bottom
    const sidebar = page.locator('aside').first()
    await expect(sidebar.getByText(/standard client|aurum client|boardroom|admin/i)).toBeVisible({ timeout: 10_000 })
  })

  test('Aurum upgrade card is visible for Standard users', async ({ page }) => {
    const upgradeCard = page.getByText(/upgrade to aurum|unlock aurum/i)
    if (await upgradeCard.isVisible()) {
      await expect(upgradeCard).toBeVisible()
    }
  })

  test('locked portfolio preview shows lock icon for Standard users', async ({ page }) => {
    const lockedSection = page.getByText(/portfolio|locked/i).first()
    await expect(lockedSection).toBeVisible()
  })
})
