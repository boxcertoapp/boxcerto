// ============================================================
// BoxCerto Service Worker
// Estratégia: Network First para tudo (app dinâmico)
// Cache de fallback para assets estáticos
// ============================================================

const CACHE_NAME = 'boxcerto-v3'

// Assets estáticos que podem ser cacheados offline
const STATIC_ASSETS = [
  '/',
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

// ── Fetch: Network First, fallback para cache ────────────
self.addEventListener('fetch', (event) => {
  // Ignora requisições para APIs externas e Supabase
  const url = new URL(event.request.url)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com') ||
    url.hostname.includes('resend.com') ||
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
        // Offline: tenta servir do cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // Para navegação, serve a index como fallback (SPA)
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
        })
      })
  )
})
