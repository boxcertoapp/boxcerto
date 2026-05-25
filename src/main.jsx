import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Captura beforeinstallprompt ANTES do React renderizar para evitar race condition.
// O hook usePWAInstall lê window.__pwaPrompt se o evento já disparou.
window.__pwaPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaPrompt = e
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ── Registro do Service Worker (PWA) ─────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('[BoxCerto] Service Worker registrado'))
      .catch((err) => console.warn('[BoxCerto] SW falhou:', err))
  })
}
