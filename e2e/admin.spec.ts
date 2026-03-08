import { test, expect } from '@playwright/test'
import { TEST_ADMIN, loginAs } from './helpers/auth'

/**
 * Admin panel tests.
 * Requires an admin account: TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD env vars.
 * Skip if not configured.
 */

const hasAdminCreds = !!(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD)

test.describe('Admin Panel', () => {
  test.skip(!hasAdminCreds, 'Skipped: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password)
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')
  })

  test('admin can access /admin', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()
  })

  test('shows total users stat', async ({ page }) => {
    await expect(page.getByText(/total users/i)).toBeVisible()
  })

  test('shows total posts stat', async ({ page }) => {
    await expect(page.getByText(/total posts/i)).toBeVisible()
  })

  test('shows support tickets stat', async ({ page }) => {
    await expect(page.getByText(/tickets/i).first()).toBeVisible()
  })

  test('shows link to user management', async ({ page }) => {
    await expect(page.getByRole('link', { name: /users|manage users/i })).toBeVisible()
  })

  test('shows link to content management', async ({ page }) => {
    await expect(page.getByRole('link', { name: /content/i })).toBeVisible()
  })

  test('shows link to ticket management', async ({ page }) => {
    await expect(page.getByRole('link', { name: /tickets/i })).toBeVisible()
  })

  test.describe('User Management (/admin/users)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/users')
      await page.waitForLoadState('domcontentloaded')
    })

    test('lists users', async ({ page }) => {
      await expect(page.getByText(/email|user/i).first()).toBeVisible()
    })

    test('shows user roles', async ({ page }) => {
      await expect(page.getByText(/standard|aurum|boardroom|admin/i).first()).toBeVisible()
    })

    test('shows join dates', async ({ page }) => {
      await expect(page.getByText(/joined|2026|2025/i).first()).toBeVisible()
    })
  })

  test.describe('Content Management (/admin/content)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/content')
      await page.waitForLoadState('domcontentloaded')
    })

    test('lists downloads', async ({ page }) => {
      await expect(page.getByText(/omni|asia scalper|aurum/i).first()).toBeVisible()
    })

    test('lists videos', async ({ page }) => {
      await expect(page.getByText(/getting started|risk management/i).first()).toBeVisible()
    })
  })

  test.describe('Ticket Management (/admin/tickets)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/tickets')
      await page.waitForLoadState('domcontentloaded')
    })

    test('shows ticket list or empty state', async ({ page }) => {
      const hasTickets = await page.getByText(/open|in progress|resolved/i).count()
      const hasEmpty = await page.getByText(/no tickets/i).count()
      expect(hasTickets + hasEmpty).toBeGreaterThan(0)
    })
  })
})
