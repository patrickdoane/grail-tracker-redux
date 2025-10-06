import { test, expect, type Response } from '@playwright/test'

const ITEM_NAME = 'Stone of Jordan'

const mutationMatches = (method: string) => (response: Response) =>
  response.url().includes('/api/user-items') &&
  response.request().method() === method &&
  response.status() < 500

const queryMatches = (response: Response) =>
  response.url().includes('/api/user-items') &&
  response.request().method() === 'GET' &&
  response.status() < 500

test.describe('Items logging', () => {
  test('logs and unlogs a grail item from the catalogue grid', async ({ page }) => {
    await page.goto('/items')

    await expect(page.getByRole('heading', { name: 'Holy Grail Items' })).toBeVisible()

    await page.waitForResponse(queryMatches)

    const itemCard = page.locator('.items-page__item-card', { hasText: ITEM_NAME })
    await expect(itemCard).toBeVisible()

    const logButton = itemCard.getByRole('button', { name: 'Log find' })
    await expect(logButton).toBeVisible()

    await Promise.all([
      page.waitForResponse(mutationMatches('POST')),
      logButton.click(),
    ])
    await page.waitForResponse(queryMatches)

    const markMissingButton = itemCard.getByRole('button', { name: 'Mark as missing' })
    await expect(markMissingButton).toBeVisible()
    await expect(markMissingButton).toBeEnabled()
    await expect(itemCard.locator('text=Found').first()).toBeVisible()

    await Promise.all([
      page.waitForResponse(mutationMatches('DELETE')),
      markMissingButton.click(),
    ])
    await page.waitForResponse(queryMatches)

    await expect(logButton).toBeVisible()
    await expect(itemCard.locator('text=Found')).toHaveCount(0)
  })
})
