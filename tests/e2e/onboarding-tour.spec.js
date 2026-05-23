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

async function openOnboarding(page, user = {}, options = {}) {
  await page.addInitScript(e2eUser => {
    window.__BOXCERTO_E2E_USER__ = e2eUser
    window.open = (...args) => {
      window.__BOXCERTO_LAST_OPEN__ = args
      return null
    }
  }, { ...baseUser, ...user })

  const db = {
    client: null,
    vehicle: null,
    os: null,
    items: [],
  }

  if (options.existingOrder) {
    db.client = {
      id: 'client-1',
      nome: 'Rogerio Silva',
      whatsapp: '51999999999',
      created_at: '2026-05-22T12:00:00.000Z',
    }
    db.vehicle = {
      id: 'vehicle-1',
      client_id: 'client-1',
      placa: 'IOL-8888',
      modelo: 'Honda CG 125 2012',
      created_at: '2026-05-22T12:00:00.000Z',
      clients: db.client,
    }
    db.items = [{
      id: 'item-1',
      os_id: 'os-1',
      descricao: 'SERVIÇO EXEMPLO PRIMEIRA OS',
      custo: 0,
      venda: 470,
      garantia: '',
      created_at: '2026-05-22T12:00:00.000Z',
    }]
    db.os = {
      id: 'os-1',
      vehicle_id: 'vehicle-1',
      status: 'orcamento',
      km: '',
      observacoes: '',
      agendado_para: null,
      payments: [],
      desconto: { tipo: 'valor', valor: 0 },
      aprovacao_token: null,
      aprovacao_status: 'pendente',
      created_at: '2026-05-22T12:00:00.000Z',
      updated_at: '2026-05-22T12:00:00.000Z',
      vehicles: db.vehicle,
      service_items: db.items,
    }
  }

  await page.route('**/rest/v1/**', async route => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const table = url.pathname.split('/').filter(Boolean).pop()
    const json = (body, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })

    if (method === 'PATCH') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}')

      if (table === 'clients') {
        db.client = {
          id: 'client-1',
          created_at: '2026-05-22T12:00:00.000Z',
          ...body,
        }
        await json(db.client, 201)
        return
      }

      if (table === 'vehicles') {
        db.vehicle = {
          id: 'vehicle-1',
          created_at: '2026-05-22T12:00:00.000Z',
          ...body,
          clients: db.client,
        }
        await json(db.vehicle, 201)
        return
      }

      if (table === 'service_orders') {
        db.os = {
          id: 'os-1',
          created_at: '2026-05-22T12:00:00.000Z',
          updated_at: '2026-05-22T12:00:00.000Z',
          aprovacao_token: null,
          aprovacao_status: 'pendente',
          ...body,
        }
        await json(db.os, 201)
        return
      }

      if (table === 'service_items') {
        const item = {
          id: `item-${db.items.length + 1}`,
          created_at: '2026-05-22T12:00:00.000Z',
          ...body,
        }
        db.items.push(item)
        await json(item, 201)
        return
      }

      await json({}, 201)
      return
    }

    if (method === 'GET' && table === 'service_items') {
      await json(db.items)
      return
    }

    if (method === 'GET' && table === 'service_orders') {
      await json(db.os ? [{ ...db.os, vehicles: db.vehicle, service_items: db.items }] : [])
      return
    }

    await json([])
  })

  await page.route('https://parallelum.com.br/fipe/api/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))

  await page.goto('/app/oficina')
}

async function fillFirstOsWizardUntilConfirm(page) {
  await expect(page.locator('[data-tour="onboarding-first-os-wizard"]')).toBeVisible()
  await expect(page.locator('[data-tour="spotlight-overlay"]')).toHaveCount(0)

  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-placa"]').fill('ABC1A23')
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText('Nome do cliente', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-nome-cliente"]').fill('Joao da Silva')
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText('WhatsApp do cliente', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-whatsapp"]').fill('51999999999')
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText('Modelo do veículo', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-modelo-manual"]').fill('Honda CG 160 2022')
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText('Tudo pronto para criar', { exact: true })).toBeVisible()
  await expect(page.locator('[data-tour="btn-criar-os"]')).toBeVisible()
}

test('tour uses the stable first OS wizard on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 740 })
  await openOnboarding(page)

  await page.getByRole('button', { name: /comecar tour guiado|começar tour guiado/i }).click()
  await page.locator('[data-tour="fab-nova-os"]:visible').click()

  const wizard = page.locator('[data-tour="onboarding-first-os-wizard"]')
  const plate = page.locator('[data-tour="input-placa"]')
  await expect(wizard).toBeVisible()
  await expect(page.locator('[data-tour="spotlight-overlay"]')).toHaveCount(0)
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()

  await plate.fill('ABC1A23')
  await page.setViewportSize({ width: 393, height: 420 })
  await expect(wizard).toBeVisible()
  await expect(plate).toBeInViewport()
  await page.getByRole('button', { name: /Continuar/i }).click()

  const name = page.locator('[data-tour="input-nome-cliente"]')
  await expect(page.getByText('Nome do cliente', { exact: true })).toBeVisible({ timeout: 6000 })
  await expect(name).toBeInViewport()

  await name.fill('Joao da Silva')
  await page.getByRole('button', { name: /Continuar/i }).click()

  const whatsapp = page.locator('[data-tour="input-whatsapp"]')
  await expect(page.getByText('WhatsApp do cliente', { exact: true })).toBeVisible()
  await whatsapp.fill('51999999999')
  await page.setViewportSize({ width: 393, height: 360 })
  await expect(wizard).toBeVisible()
  await expect(whatsapp).toBeInViewport()
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText('Modelo do veículo', { exact: true })).toBeVisible()
  await expect(page.locator('[data-tour="input-modelo-manual"]')).toBeInViewport()
})

test('tour resumes after the first OS is already complete', async ({ page }) => {
  await openOnboarding(page, { onboardingOsDone: true }, { existingOrder: true })

  await expect(page.getByText(/Abra a OS criada/i)).toHaveCount(0)
  await expect(page.locator('[data-tour="btn-enviar-cliente"]')).toBeVisible()
  await expect(page.getByText(/Envie pelo WhatsApp/i)).toBeVisible()
  await expect(page.getByText(/Vamos abrir sua primeira OS juntos/i)).toHaveCount(0)
})

test('tour restores the latest step saved in the browser', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('boxcerto:onboarding-tour:e2e-owner', 'configurar-oficina')
  })
  await openOnboarding(page)

  await expect(page).toHaveURL(/\/app\/menu$/)
  await expect(page.getByText(/Adicione o logotipo/i)).toBeVisible()
})

test('tour reconciles stale saved form step with visible plate field', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('boxcerto:onboarding-tour:e2e-owner', 'client-name')
  })
  await openOnboarding(page)

  await page.locator('[data-tour="fab-nova-os"]:visible').click()

  await expect(page.locator('[data-tour="onboarding-first-os-wizard"]')).toBeVisible()
  await expect(page.locator('[data-tour="input-placa"]')).toBeVisible()
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await expect(page.getByText('Nome do cliente', { exact: true })).toHaveCount(0)
})

test('guided first OS creates the example service and opens WhatsApp step', async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole('button', { name: /comecar tour guiado|começar tour guiado/i }).click()
  await page.locator('[data-tour="fab-nova-os"]:visible').click()
  await fillFirstOsWizardUntilConfirm(page)
  await page.locator('[data-tour="btn-criar-os"]').click()

  await expect(page.getByText(/Conclu.mos nossa primeira OS/i)).toBeVisible()
  await expect(page.getByText(/SERVI.O EXEMPLO PRIMEIRA OS/i)).toBeVisible()
  await page.getByRole('button', { name: /Enviar pelo WhatsApp/i }).click()

  await expect(page.locator('[data-tour="btn-enviar-cliente"]')).toBeVisible()
  await expect(page.getByText(/SERVIÇO EXEMPLO PRIMEIRA OS/i)).toBeVisible()
  await expect(page.getByText(/Envie pelo WhatsApp/i)).toBeVisible()
  await page.locator('[data-tour="btn-enviar-cliente"]').click()
  await expect(page.getByText(/or.amento enviado/i)).toBeVisible()
  await page.getByRole('button', { name: /Configurar oficina/i }).click()
  await expect(page).toHaveURL(/\/app\/menu$/)
  await expect(page.getByText(/Adicione o logotipo/i)).toBeVisible()
  await page.getByRole('button', { name: /Pular logo/i }).click()

  const address = page.locator('[data-tour="input-endereco-oficina"][data-tour-active="true"]')
  await expect(page.getByText(/Preencha o endere.o/i)).toBeVisible()
  await expect(address).toBeVisible()
  await address.fill('Rua 1 N 12')
  await expect(page.getByRole('button', { name: /Continuar/i })).toBeVisible()
  await page.getByRole('button', { name: /Continuar/i }).click()

  await expect(page.getByText(/Salve os dados da oficina/i)).toBeVisible()
  const saveOffice = page.locator('[data-tour="btn-config-oficina"][data-tour-active="true"]')
  await expect(saveOffice).toBeVisible()
  await saveOffice.click()
  await expect(page.getByText(/top 1% das oficinas/i)).toBeVisible()
})

test('tour opens the created OS automatically before WhatsApp when detail is closed', async ({ page }) => {
  await openOnboarding(page, { onboardingOsDone: true }, { existingOrder: true })

  await expect(page.getByText(/Abra a OS criada/i)).toHaveCount(0)
  await expect(page.locator('[data-tour="btn-enviar-cliente"]')).toBeVisible()
  await expect(page.getByText(/Envie pelo WhatsApp/i)).toBeVisible()
})
