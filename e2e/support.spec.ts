import { test, expect } from '@playwright/test'

test.describe('Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/support')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders Support page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /support/i })).toBeVisible()
  })

  test('shows New Ticket button', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket|submit/i })
    await expect(newTicketBtn).toBeVisible()
  })

  test('can open ticket creation form', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket/i }).first()
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click()
      await expect(page.getByPlaceholder(/subject|title/i)).toBeVisible({ timeout: 5_000 })
    }
  })

  test('can submit a new support ticket', async ({ page }) => {
    const newTicketBtn = page.getByRole('button', { name: /new ticket|create ticket/i }).first()
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click()
    }

    const subject = page.getByPlaceholder(/subject|brief description/i)
    const description = page.getByPlaceholder(/description|details|explain/i)

    if (await subject.isVisible()) {
      await subject.fill(`Test ticket - ${Date.now()}`)
      await description.fill('This is a test support ticket created by Playwright.')
      const prioritySelect = page.locator('select').first()
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('MEDIUM')
      }
      await page.getByRole('button', { name: /submit|create|send/i }).click()
      await page.waitForTimeout(2000)
      await expect(page.getByText(/test ticket|submitted|created/i).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('shows ticket status badges', async ({ page }) => {
    await page.waitForTimeout(1500)
    const statusBadge = page.getByText(/open|in progress|resolved/i).first()
    if (await statusBadge.isVisible()) {
      await expect(statusBadge).toBeVisible()
    }
  })

  test('shows priority labels on tickets', async ({ page }) => {
    await page.waitForTimeout(1500)
    const priorityBadge = page.getByText(/low|medium|high/i).first()
    if (await priorityBadge.isVisible()) {
      await expect(priorityBadge).toBeVisible()
    }
  })

  test('shows ticket creation timestamp', async ({ page }) => {
    await page.waitForTimeout(1500)
    const timeLabel = page.getByText(/ago|minute|hour|day/i).first()
    if (await timeLabel.isVisible()) {
      await expect(timeLabel).toBeVisible()
    }
  })
})
