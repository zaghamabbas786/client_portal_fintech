import { test, expect } from '@playwright/test'

/**
 * EA Requests (Phase 2) E2E tests.
 * Users can request EAs via /my-eas/request and see their requests on My EAs page.
 */

test.describe('EA Requests', () => {
  test('Request EA page loads and shows form', async ({ page }) => {
    await page.goto('/my-eas/request')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: /request ea/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder(/tell us which ea/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /submit request/i })).toBeVisible()
  })

  test('Request EA form requires message', async ({ page }) => {
    await page.goto('/my-eas/request')
    await page.waitForLoadState('domcontentloaded')
    const submitBtn = page.getByRole('button', { name: /submit request/i })
    await expect(submitBtn).toBeDisabled()
  })

  test('Request EA form enables submit when message is entered', async ({ page }) => {
    await page.goto('/my-eas/request')
    await page.waitForLoadState('domcontentloaded')
    await page.getByPlaceholder(/tell us which ea/i).fill('I would like to request Aurum EA for my FTMO account.')
    const submitBtn = page.getByRole('button', { name: /submit request/i })
    await expect(submitBtn).toBeEnabled()
  })

  test('My EAs page has Request EA button', async ({ page }) => {
    await page.goto('/my-eas')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('link', { name: /request ea/i })).toBeVisible()
  })

  test('Request EA page has Back to My EAs link', async ({ page }) => {
    await page.goto('/my-eas/request')
    await page.waitForLoadState('domcontentloaded')
    const backLink = page.getByRole('link', { name: /back to my eas/i })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await expect(page).toHaveURL(/\/my-eas$/)
  })
})
