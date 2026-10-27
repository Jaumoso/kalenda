import { expect, test, type Page } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@kalenda.app'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'

async function openDashboard(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /my calendars|mis calendarios/i })).toBeVisible()
}

async function deleteProject(page: Page, projectId: string) {
  await page.context().request.delete(`${process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'}/api/projects/${projectId}`)
}

test.describe('core user flows', () => {
  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.context().clearCookies()
    await page.goto('/login')
    await page.locator('#email').fill(adminEmail)
    await page.locator('#password').fill('invalid-password')
    await page.getByRole('button', { name: /sign in|iniciar sesión/i }).click()

    await expect(page.getByText(/invalid credentials|credenciales inválidas/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs in and creates a calendar project', async ({ page }) => {
    await openDashboard(page)

    const projectName = `E2E Calendar ${Date.now()}`
    await page.getByRole('button', { name: /new calendar|nuevo calendario/i }).first().click()
    await page.getByLabel(/name|nombre/i).fill(projectName)
    await page.getByRole('button', { name: /create calendar|crear calendario/i }).click()

    await expect(page.getByText(projectName, { exact: true })).toBeVisible()
    const projectLink = page.getByRole('link', { name: new RegExp(projectName) }).first()
    await projectLink.click()
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    const projectId = new URL(page.url()).pathname.split('/')[2]
    expect(projectId).toBeTruthy()
    await deleteProject(page, projectId)
  })

  test('edits a month and adds a day event', async ({ page }) => {
    await openDashboard(page)

    const projectName = `E2E Editor ${Date.now()}`
    await page.getByRole('button', { name: /new calendar|nuevo calendario/i }).first().click()
    await page.getByLabel(/name|nombre/i).fill(projectName)
    await page.getByRole('button', { name: /create calendar|crear calendario/i }).click()
    await page.getByRole('link', { name: new RegExp(projectName) }).first().click()

    const projectId = new URL(page.url()).pathname.split('/')[2]
    await page.locator('a[href*="/months/"]').first().click()
    await expect(page).toHaveURL(/\/months\/[^/]+$/)
    await expect(page.getByRole('heading', { name: /January|Enero/ })).toBeVisible()

    await page.getByTestId('calendar-day-1').click()
    await expect(page.getByText(/Day 1|Día 1/)).toBeVisible()
    await page
      .getByRole('button', { name: /add event for this day|añadir evento para este día/i })
      .click()
    await page.getByPlaceholder(/event name|nombre del evento/i).fill('E2E birthday')
    await page.getByRole('button', { name: /^(add|añadir)$/i }).click()
    await expect(page.getByText(/E2E birthday/)).toBeVisible()

    await page.getByRole('button', { name: /save|guardar/i }).last().click()
    await expect(page.getByText(/unsaved|sin guardar/i)).not.toBeVisible()
    await deleteProject(page, projectId)
  })

  test('opens preview and export controls from a project', async ({ page }) => {
    await openDashboard(page)

    const projectName = `E2E Export ${Date.now()}`
    await page.getByRole('button', { name: /new calendar|nuevo calendario/i }).first().click()
    await page.getByLabel(/name|nombre/i).fill(projectName)
    await page.getByRole('button', { name: /create calendar|crear calendario/i }).click()
    await page.getByRole('link', { name: new RegExp(projectName) }).first().click()

    const projectId = new URL(page.url()).pathname.split('/')[2]
    await page.getByRole('button', { name: /preview|vista previa/i }).click()
    await expect(page.getByRole('heading', { name: /preview|vista previa/i })).toBeVisible()
    await page.getByRole('button', { name: /close|cerrar/i }).click()

    await page.getByRole('button', { name: /export|exportar/i }).click()
    await expect(
      page.getByRole('heading', { name: /^export calendar$|^exportar calendario$/i }),
    ).toBeVisible()
    await expect(page.locator('input[type="text"]')).toHaveCount(1)
    await deleteProject(page, projectId)
  })
})
