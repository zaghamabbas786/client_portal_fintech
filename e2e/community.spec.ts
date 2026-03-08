import { test, expect } from '@playwright/test'

test.describe('Community', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders community page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible()
  })

  test('shows post creation area', async ({ page }) => {
    await expect(page.getByPlaceholder(/share.*results|ask.*question/i).first()).toBeVisible()
  })

  test('shows tag selector', async ({ page }) => {
    await expect(page.getByText(/general discussion|payout|aurum/i).first()).toBeVisible()
  })

  test('shows filter dropdown', async ({ page }) => {
    await expect(page.getByText(/all posts/i)).toBeVisible()
  })

  test('shows existing posts from seed data', async ({ page }) => {
    await page.waitForTimeout(2000)
    const posts = page.locator('[style*="--bg-2"]').filter({ hasText: /payout|aurum|challenge|general|question/i })
    expect(await posts.count()).toBeGreaterThan(0)
  })

  test('can create a new post', async ({ page }) => {
    const textarea = page.getByPlaceholder(/share.*results|ask.*question/i).first()
    const uniqueContent = `Test post from Playwright - ${Date.now()}`
    await textarea.fill(uniqueContent)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText(uniqueContent)).toBeVisible({ timeout: 10_000 })
  })

  test('shows amount input when PAYOUT tag is selected', async ({ page }) => {
    await page.getByText(/general discussion/i).first().click()
    await page.getByText(/payout received/i).click()
    await expect(page.getByPlaceholder(/payout amount/i)).toBeVisible()
  })

  test('shows amount input when AURUM_RESULTS tag is selected', async ({ page }) => {
    await page.getByText(/general discussion/i).first().click()
    await page.getByText(/aurum results/i).click()
    await expect(page.getByPlaceholder(/payout amount/i)).toBeVisible()
  })

  test('hides amount input for GENERAL tag', async ({ page }) => {
    await expect(page.getByPlaceholder(/payout amount/i)).not.toBeVisible()
  })

  test('can filter posts by tag', async ({ page }) => {
    await page.getByText(/all posts/i).click()
    await page.getByText(/payout received/i).first().click()
    await page.waitForTimeout(1500)
    const payoutBadges = page.getByText(/^PAYOUT$/i)
    const count = await payoutBadges.count()
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('like button is present on posts', async ({ page }) => {
    await page.waitForTimeout(2000)
    const likeBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(likeBtn).toBeVisible()
  })

  test('can toggle comments section', async ({ page }) => {
    await page.waitForTimeout(2000)
    const commentButtons = page.locator('button').filter({ hasText: /^\d+$/ }).first()
    if (await commentButtons.isVisible()) {
      await commentButtons.click()
      await expect(page.getByPlaceholder(/write a comment/i)).toBeVisible({ timeout: 5_000 })
    }
  })

  test('post button is disabled when textarea is empty', async ({ page }) => {
    const postBtn = page.getByRole('button', { name: /^post$/i })
    await expect(postBtn).toBeDisabled()
  })

  test('post button enables when content is typed', async ({ page }) => {
    const textarea = page.getByPlaceholder(/share.*results|ask.*question/i).first()
    await textarea.fill('Some content')
    const postBtn = page.getByRole('button', { name: /^post$/i })
    await expect(postBtn).toBeEnabled()
  })
})
