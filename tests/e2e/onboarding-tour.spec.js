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

test('tour waits on required Nova OS inputs on mobile', async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole('button', { name: /comecar tour guiado|começar tour guiado/i }).click()
  await page.locator('[data-tour="fab-nova-os"]:visible').click()

  const plate = page.locator('[data-tour="input-placa"]')
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await expect(page.locator('[data-tour="spotlight-overlay"]').first()).toHaveCSS('pointer-events', 'auto')
  await plate.fill('ABC1A23')
  await page.setViewportSize({ width: 393, height: 420 })
  await expect(plate).toBeInViewport()
  await page.waitForTimeout(900)
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()

  await plate.blur()

  const name = page.locator('[data-tour="input-nome-cliente"]')
  await expect(page.getByText('Digite o nome do cliente', { exact: true })).toBeVisible({ timeout: 6000 })
  const modalScroll = page.locator('[data-tour="nova-os-scroll"]')
  await expect.poll(() => modalScroll.evaluate(el => el.scrollHeight > el.clientHeight)).toBeTruthy()
  await page.waitForTimeout(500)
  const guidedScrollTop = await modalScroll.evaluate(el => el.scrollTop)
  await page.mouse.move(10, 10)
  await page.mouse.wheel(0, 700)
  await expect.poll(() => modalScroll.evaluate(el => el.scrollTop)).toBe(guidedScrollTop)

  await name.fill('Joao da Silva')
  await page.waitForTimeout(900)
  await expect(page.getByText('Digite o nome do cliente', { exact: true })).toBeVisible()

  await name.blur()
  const whatsapp = page.locator('[data-tour="input-whatsapp"]')
  await expect(page.getByRole('heading', { name: 'Digite o WhatsApp' })).toBeVisible()
  await whatsapp.fill('51999999999')
  await page.setViewportSize({ width: 393, height: 360 })
  await expect(whatsapp).toBeInViewport()
  await page.waitForTimeout(900)
  await expect(page.getByRole('heading', { name: 'Digite o WhatsApp' })).toBeVisible()

  await whatsapp.blur()
  await expect(page.getByRole('heading', { name: 'Digite o modelo do veículo' })).toBeVisible()
  await expect(page.locator('[data-tour="input-modelo-manual"]')).toBeInViewport()
})

test('tour resumes after the first OS is already complete', async ({ page }) => {
  await openOnboarding(page, { onboardingOsDone: true }, { existingOrder: true })

  await expect(page.getByText(/Abra a OS criada/i)).toBeVisible()
  await expect(page.locator('[data-tour="card-onboarding-os"]:visible')).toBeVisible()
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

  await expect(page.locator('[data-tour="input-placa"]')).toBeVisible()
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await expect(page.getByText('Digite o nome do cliente', { exact: true })).toHaveCount(0)
})

test('guided first OS creates the example service and opens WhatsApp step', async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole('button', { name: /comecar tour guiado|começar tour guiado/i }).click()
  await page.locator('[data-tour="fab-nova-os"]:visible').click()
  await expect(page.getByText('Digite a placa', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-placa"]').fill('ABC1A23')
  await page.locator('[data-tour="input-placa"]').blur()

  await expect(page.getByText('Digite o nome do cliente', { exact: true })).toBeVisible()
  await page.locator('[data-tour="input-nome-cliente"]').fill('Joao da Silva')
  await page.locator('[data-tour="input-nome-cliente"]').blur()
  await expect(page.getByRole('heading', { name: 'Digite o WhatsApp' })).toBeVisible()
  await page.locator('[data-tour="input-whatsapp"]').fill('51999999999')
  await page.locator('[data-tour="input-whatsapp"]').blur()
  await expect(page.getByRole('heading', { name: 'Digite o modelo do veículo' })).toBeVisible()
  await page.locator('[data-tour="input-modelo-manual"]').fill('Honda CG 160 2022')
  await page.locator('[data-tour="input-modelo-manual"]').blur()
  await expect(page.getByRole('heading', { name: 'Crie e abra a primeira OS' })).toBeVisible()
  await page.locator('[data-tour="btn-criar-os"]').click()

  await expect(page.locator('[data-tour="btn-enviar-cliente"]')).toBeVisible()
  await expect(page.getByText(/SERVIÇO EXEMPLO PRIMEIRA OS/i)).toBeVisible()
  await expect(page.getByText(/Envie pelo WhatsApp/i)).toBeVisible()
})

test('tour opens the created OS card before WhatsApp when detail is closed', async ({ page }) => {
  await openOnboarding(page, { onboardingOsDone: true }, { existingOrder: true })

  await expect(page.getByText(/Abra a OS criada/i)).toBeVisible()
  await page.locator('[data-tour="card-onboarding-os"]:visible').click()

  await expect(page.locator('[data-tour="btn-enviar-cliente"]')).toBeVisible()
  await expect(page.getByText(/Envie pelo WhatsApp/i)).toBeVisible()
})
