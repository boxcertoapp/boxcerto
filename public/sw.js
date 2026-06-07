// ============================================================
// BoxCerto Service Worker
// Estratégia: Network First para tudo (app dinâmico)
// Cache de fallback para assets estáticos
// ============================================================

const CACHE_NAME = 'boxcerto-v6'

// NÃO inclui '/' — index.html nunca pode ser cacheado (hashes de chunk mudam a cada deploy)
const STATIC_ASSETS = [
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
]

// ── Install: pré-cacheia assets estáticos ────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Falha silenciosa se algum asset não estiver disponível
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: remove caches antigos ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

// ── Push: recebe notificação do servidor ─────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { return }

  const title = payload.title || 'BoxCerto'
  const options = {
    body: payload.body || '',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    data: { url: payload.url || '/app/oficina' },
    // tag agrupa notificações da mesma OS (substitui em vez de empilhar)
    tag: 'os-' + (payload.osId || 'geral'),
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// ── NotificationClick: abre a OS ao clicar ───────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/app/oficina'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Foca aba já aberta se existir
        const existing = clients.find(c => c.url.startsWith(self.location.origin))
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        // Abre nova aba
        if (self.clients.openWindow) return self.clients.openWindow(url)
      })
  )
})

// ── Fetch: Network First, fallback para cache ────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignora qualquer request que não seja http/https
  // (chrome-extension://, moz-extension://, etc. causam TypeError no cache.put)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // Navegações (documento/HTML) NÃO passam pelo SW — o browser busca direto da rede.
  // Mantém o index.html sempre fresco e tira o SW do caminho crítico de carregamento
  // da página (evita tela branca / erros de "Failed to convert to Response").
  if (event.request.mode === 'navigate' || event.request.destination === 'document') return

  // Ignora requisições para APIs externas, Supabase e rotas /api/*
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com') ||
    url.hostname.includes('resend.com') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cacheia respostas bem-sucedidas de assets estáticos
        if (
          response.ok &&
          (event.request.destination === 'image' ||
           event.request.destination === 'style' ||
           event.request.destination === 'script' ||
           event.request.destination === 'font')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline/falha: serve do cache se houver; senão devolve um erro de rede
        // VÁLIDO (nunca undefined — undefined quebra o respondWith).
        return caches.match(event.request).then((cached) => cached || Response.error())
      })
  )
})
