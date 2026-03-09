import { test, expect } from '@playwright/test'

// Override viewport to mobile for all tests in this file
test.use({ viewport: { width: 375, height: 812 } })

test.describe('Mobile Responsiveness', () => {
  test('sidebar is hidden by default on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const sidebar = page.locator('aside').first()
    // On mobile, sidebar should be off-screen (transform translateX or not visible)
    const box = await sidebar.boundingBox()
    // Either not visible or positioned off-screen (x < 0)
    if (box) {
      expect(box.x).toBeLessThan(0)
    } else {
      // sidebar is hidden via CSS
      await expect(sidebar).not.toBeInViewport()
    }
  })

  test('hamburger menu button is visible on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('[data-testid="menu-toggle"]')).toBeVisible()
  })

  test('tapping hamburger opens the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('[data-testid="menu-toggle"]').click()
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeInViewport({ timeout: 3000 })
  })

  test('tapping overlay closes the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('[data-testid="menu-toggle"]').click()
    // Tap the overlay backdrop
    const overlay = page.locator('[data-testid="sidebar-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 3000 })
    await overlay.click()
    await expect(overlay).not.toBeVisible()
  })

  test('main content takes full width on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const main = page.locator('main').first()
    const box = await main.boundingBox()
    expect(box?.width).toBeGreaterThan(300) // should span near full viewport
  })

  test('community page is usable on mobile', async ({ page }) => {
    await page.goto('/community')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: /community/i })).toBeVisible()
    await expect(page.getByPlaceholder(/share.*results|ask.*question/i).first()).toBeVisible()
  })

  test('education page grids stack on mobile', async ({ page }) => {
    await page.goto('/education')
    await page.waitForLoadState('domcontentloaded')
    const cards = page.locator('[data-testid="video-card"]')
    const count = await cards.count()
    if (count > 1) {
      const first = await cards.nth(0).boundingBox()
      const second = await cards.nth(1).boundingBox()
      // On mobile, cards should stack vertically (second card below first)
      if (first && second) {
        expect(second.y).toBeGreaterThan(first.y)
      }
    }
  })
})
