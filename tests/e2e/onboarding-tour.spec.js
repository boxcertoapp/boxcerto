import { expect, test } from '@playwright/test'

const baseUser = {
  id: 'e2e-owner',
  email: 'owner@boxcerto.test',
  oficina: 'Oficina E2E',
  responsavel: 'Responsavel E2E',
  status: 'trial',
  trialEnd: '2099-01-01T12:00:00.000Z',
  isAdmin: false,
  isTecnico: false,
  onboardingOficinaD: false,
  onboardingOsDone: false,
  onboardingOrcamentoDone: false,
  onboardingDismissed: false,
}

async function openOnboarding(page, user = {}) {
  await page.addInitScript(e2eUser => {
    window.__BOXCERTO_E2E_USER__ = e2eUser
  }, { ...baseUser, ...user })

  await page.route('**/rest/v1/**', async route => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.fulfill({
      status: route.request().method() === 'GET' ? 200 : 201,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await page.route('https://parallelum.com.br/fipe/api/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))

  await page.goto('/app/oficina')
}

test('tour waits on required Nova OS inputs on mobile', async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole('button', { name: /vamos la|vamos lá/i }).click()
  await page.locator('[data-tour="fab-nova-os"]:visible').click()

  const plate = page.locator('[data-tour="input-placa"]')
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await plate.fill('ABC1A23')
  await page.waitForTimeout(1700)
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()

  await plate.blur()
  await expect(page.getByRole('heading', { name: /Clique em Buscar \/ Abrir OS/ })).toBeVisible()
  await page.locator('[data-tour="btn-buscar-placa"]').click()

  const name = page.locator('[data-tour="input-nome-cliente"]')
  await expect(page.getByText('Nome do cliente *', { exact: true })).toBeVisible({ timeout: 6000 })
  await name.fill('Joao da Silva')
  await page.waitForTimeout(1700)
  await expect(page.getByText('Nome do cliente *', { exact: true })).toBeVisible()

  await name.blur()
  const whatsapp = page.locator('[data-tour="input-whatsapp"]')
  await expect(page.getByRole('heading', { name: 'WhatsApp *' })).toBeVisible()
  await whatsapp.fill('51999999999')
  await page.waitForTimeout(1700)
  await expect(page.getByRole('heading', { name: 'WhatsApp *' })).toBeVisible()

  await whatsapp.blur()
  await expect(page.getByRole('heading', { name: /Marca do veiculo|Marca do veículo/i })).toBeVisible()
})

test('tour resumes after the first OS is already complete', async ({ page }) => {
  await openOnboarding(page, { onboardingOsDone: true })

  await expect(page.getByText(/Agora envie o orcamento|Agora envie o orçamento/i)).toBeVisible()
  await expect(page.getByText(/Vamos configurar sua oficina agora/i)).toHaveCount(0)
})

test('tour restores the latest step saved in the browser', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('boxcerto:onboarding-tour:e2e-owner', 'configurar-oficina')
  })
  await openOnboarding(page)

  await expect(page).toHaveURL(/\/app\/menu$/)
  await expect(page.getByText(/Preencha os dados da oficina/i)).toBeVisible()
})
