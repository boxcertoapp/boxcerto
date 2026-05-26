/**
 * usePWAInstall — detecta capacidade de instalação PWA por plataforma.
 *
 * Singleton de módulo: o deferredPrompt é compartilhado entre todas as
 * instâncias do hook (OnboardingWizard, Menu, etc.) na mesma sessão.
 * Isso evita que uma instância consuma o prompt e as demais percam o estado.
 *
 * Android / Desktop Chrome / Edge:
 *   - Captura `beforeinstallprompt`, expõe `promptInstall()` que dispara o prompt nativo.
 *
 * iOS Safari:
 *   - Não há API de prompt — apenas detecta e retorna `isIOS: true`.
 *   - O chamador exibe a bottom sheet com instruções manuais.
 *
 * Já instalado (standalone):
 *   - `isInstalled: true`, `canInstall: false` — toda UI de instalação some.
 */
import { useState, useEffect, useCallback } from 'react'

// ── Singleton de módulo ────────────────────────────────────────────────────
// Persiste o prompt entre mount/unmount de componentes na mesma sessão.
let _savedPrompt = null
const _subscribers = new Set()

function _setPrompt(p) {
  _savedPrompt = p
  _subscribers.forEach(fn => fn())
}

// Resgata prompt capturado antes do módulo carregar (race condition em main.jsx)
if (typeof window !== 'undefined') {
  if (window.__pwaPrompt) {
    _savedPrompt = window.__pwaPrompt
    window.__pwaPrompt = null
  }
  // Captura eventos futuros (inclusive se o módulo carregou antes do evento)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _setPrompt(e)
  })
}
// ──────────────────────────────────────────────────────────────────────────

export function usePWAInstall() {
  // Estado local inicializado a partir do singleton — nunca perde o prompt
  const [prompt, setLocalPrompt] = useState(_savedPrompt)
  const [isInstalled, setIsInstalled]  = useState(false)
  const [isIOS, setIsIOS]              = useState(false)

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      !!window.navigator.standalone

    setIsInstalled(checkStandalone())

    // iOS Safari — Chrome/Firefox no iOS não suportam install PWA
    const ua = navigator.userAgent
    const iosDevice  = /iPhone|iPad|iPod/i.test(ua)
    const safariOnly = iosDevice &&
      /Safari/i.test(ua) &&
      !/Chrome|CriOS|FxiOS|EdgiOS|OPT/i.test(ua)
    setIsIOS(safariOnly && !checkStandalone())

    // Subscriber: sincroniza estado local quando o singleton muda
    const onPromptChange = () => setLocalPrompt(_savedPrompt)
    _subscribers.add(onPromptChange)

    const onInstalled = () => { setIsInstalled(true); _setPrompt(null) }

    const mq = window.matchMedia('(display-mode: standalone)')
    const onMqChange = (e) => { if (e.matches) setIsInstalled(true) }

    window.addEventListener('appinstalled', onInstalled)
    mq.addEventListener('change', onMqChange)

    return () => {
      _subscribers.delete(onPromptChange)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener('change', onMqChange)
    }
  }, [])

  /** true quando é possível instalar (e ainda não está instalado) */
  const canInstall = !isInstalled && (prompt !== null || isIOS)

  /**
   * Dispara o prompt nativo (Android/Desktop) ou retorna `'ios'`
   * para que o chamador exiba a bottom sheet de instruções.
   * Consome o prompt — notifica todas as instâncias do hook via singleton.
   */
  const promptInstall = useCallback(async () => {
    if (!prompt) return 'ios'
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    _setPrompt(null)   // consome e notifica todas as instâncias
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome
  }, [prompt])

  return {
    canInstall,
    isIOS,
    isInstalled,
    hasDeferredPrompt: !!prompt,
    promptInstall,
  }
}
