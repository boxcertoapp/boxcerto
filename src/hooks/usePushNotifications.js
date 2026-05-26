/**
 * usePushNotifications — gerencia permissão e subscription de Web Push.
 *
 * Fluxo:
 *   1. Verifica suporte (Notification API + PushManager)
 *   2. subscribe() → requestPermission → PushManager.subscribe → salva no Supabase
 *   3. Subscription salva em push_subscriptions (user_id, endpoint, p256dh, auth_key)
 *
 * iOS: só funciona se o PWA estiver instalado (adicionado à tela inicial).
 * A VAPID_PUBLIC_KEY vem de VITE_VAPID_PUBLIC_KEY no .env.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/** Converte a VAPID public key de base64url para Uint8Array */
function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

const isSupported =
  typeof window !== 'undefined' &&
  typeof Notification !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    isSupported ? Notification.permission : 'denied'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)

  // Verifica se já existe subscription ativa
  useEffect(() => {
    if (!isSupported) return
    setPermission(Notification.permission)
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub  => setIsSubscribed(!!sub))
      .catch(() => {})
  }, [])

  /**
   * Pede permissão ao browser, cria subscription e salva no Supabase.
   * Retorna: 'granted' | 'denied' | 'unsupported' | 'error'
   */
  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return 'unsupported'
    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return 'denied'

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('Not authenticated')

      const { endpoint, keys } = sub.toJSON()
      await supabase.from('push_subscriptions').upsert(
        { user_id: session.user.id, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
        { onConflict: 'endpoint' }
      )

      setIsSubscribed(true)
      window.dataLayer?.push({ event: 'push_notifications_enabled' })
      return 'granted'
    } catch (err) {
      console.warn('[usePushNotifications] subscribe error:', err)
      return 'error'
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,        // 'default' | 'granted' | 'denied'
    isSubscribed,
    isLoading,
    subscribe,
  }
}
