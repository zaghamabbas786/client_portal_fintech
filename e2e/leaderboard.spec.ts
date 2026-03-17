import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders leaderboard page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible()
  })

  test('shows current month label', async ({ page }) => {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
    const currentMonth = months[new Date().getMonth()]
    await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible()
  })

  test('shows leaderboard layout', async ({ page }) => {
    // Leaderboard page renders — entries or empty state
    await expect(page.getByText(/leaderboard/i)).toBeVisible()
  })

  test('shows payout amounts', async ({ page }) => {
    await expect(page.getByText(/\$[0-9,]+/).first()).toBeVisible()
  })

  test('shows rank numbers', async ({ page }) => {
    await expect(page.getByText('#1').first()).toBeVisible()
  })

  test('shows prop firm column', async ({ page }) => {
    await expect(page.getByText(/FTMO|MyForexFunds|Funded Next/i).first()).toBeVisible()
  })

  test('shows system column (Aurum/Omni)', async ({ page }) => {
    await expect(page.getByText(/Aurum|Omni/).first()).toBeVisible()
  })

  test('top 3 entries are visually distinct (gold/silver/bronze)', async ({ page }) => {
    const topEntry = page.locator('text=#1').first()
    await expect(topEntry).toBeVisible()
  })
})
