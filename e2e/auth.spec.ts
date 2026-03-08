import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs } from './helpers/auth'

test.describe('Authentication', () => {

  // These tests need a clean logged-out state — override the global storageState
  test.describe('Login page', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('renders login form', async ({ page }) => {
      await expect(page.getByText('Welcome back')).toBeVisible()
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('••••••••')).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('shows magic link button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible()
    })

    test('shows link to signup page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.getByPlaceholder('you@example.com').fill('wrong@example.com')
      await page.getByPlaceholder('••••••••').fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page.locator('[style*="--red"]').filter({ hasText: /invalid|credentials|password/i }))
        .toBeVisible({ timeout: 10_000 })
    })

    test('shows validation error for magic link without email', async ({ page }) => {
      await page.getByRole('button', { name: /send magic link/i }).click()
      await expect(page.getByText(/enter your email/i)).toBeVisible()
    })

    test('toggles password visibility', async ({ page }) => {
      const input = page.getByPlaceholder('••••••••')
      expect(await input.getAttribute('type')).toBe('password')
      await page.getByRole('button').filter({ has: page.locator('svg') }).nth(0).click()
      expect(await input.getAttribute('type')).toBe('text')
    })

    test('redirects to dashboard on valid login', async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password)
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('Signup page', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/signup')
    })

    test('renders signup form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    })

    test('shows link back to login', async ({ page }) => {
      await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible()
    })
  })

  test.describe('Auth redirect', () => {
    test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
      // Override — needs no session to test the redirect
      await page.context().clearCookies()
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    })

    test('redirects authenticated user from /login to /dashboard', async ({ page }) => {
      // Already has session from storageState — just navigate to /login
      await page.goto('/login')
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
    })
  })
})
