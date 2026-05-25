/**
 * usePWAInstall — detecta capacidade de instalação PWA por plataforma.
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

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled]       = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      !!window.navigator.standalone   // iOS Safari standalone flag

    setIsInstalled(checkStandalone())

    // iOS Safari — Chrome/Firefox no iOS não suportam install PWA
    const ua = navigator.userAgent
    const iosDevice  = /iPhone|iPad|iPod/i.test(ua)
    const safariOnly = iosDevice &&
      /Safari/i.test(ua) &&
      !/Chrome|CriOS|FxiOS|EdgiOS|OPT/i.test(ua)
    setIsIOS(safariOnly && !checkStandalone())

    // Android / Desktop: captura o evento antes que o browser mostre o banner padrão
    const onPrompt    = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    const onInstalled = ()  => { setIsInstalled(true); setDeferredPrompt(null) }

    // Atualiza caso o usuário instale enquanto a página está aberta
    const mq = window.matchMedia('(display-mode: standalone)')
    const onMqChange = (e) => { if (e.matches) setIsInstalled(true) }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    mq.addEventListener('change', onMqChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener('change', onMqChange)
    }
  }, [])

  /** true quando é possível instalar (e ainda não está instalado) */
  const canInstall = !isInstalled && (deferredPrompt !== null || isIOS)

  /**
   * Dispara o prompt nativo (Android/Desktop) ou retorna `'ios'`
   * para que o chamador exiba a bottom sheet de instruções.
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'ios'
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome        // 'accepted' | 'dismissed'
  }, [deferredPrompt])

  return {
    canInstall,
    isIOS,
    isInstalled,
    hasDeferredPrompt: !!deferredPrompt,
    promptInstall,
  }
}
