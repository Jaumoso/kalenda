import { expect, test as setup } from '@playwright/test'
import fs from 'node:fs'

const authFile = 'playwright/.auth/admin.json'
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@kalenda.app'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'

fs.mkdirSync('playwright/.auth', { recursive: true })

setup('authenticate administrator', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(adminEmail)
  await page.locator('#password').fill(adminPassword)
  await page.getByRole('button', { name: /sign in|iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/$/)

  const skipOnboarding = page.getByRole('button', { name: /skip|saltar/i })
  if (await skipOnboarding.isVisible()) {
    await skipOnboarding.click()
  }

  await expect(page.getByRole('heading', { name: /my calendars|mis calendarios/i })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
