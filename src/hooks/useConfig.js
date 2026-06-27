// ============================================================
// useConfig.js — Configurações globais do BoxCerto
//
// Retorna CONFIG_DEFAULTS imediatamente (sem delay) e atualiza
// assim que o Supabase carregar — dynamic import para não bloquear
// o bundle inicial de landing pages.
// ============================================================
import { useState, useEffect } from 'react'

// Valores padrão — usados enquanto o fetch não completa (ou se falhar)
export const CONFIG_DEFAULTS = {
  price_monthly:        '97.00',
  price_annual:         '958.80',
  price_annual_monthly: '79.90',
  trial_days:           '7',
  trial_message:        'Experimente grátis por 7 dias, sem cartão necessário.',
  // Telefone de suporte (formato wa.me: 55 + DDD + número). Editável no admin.
  support_phone:        '5553997065725',
  // Feature flag: seção de fotos na OS (off em produção até liberar; admin sempre vê)
  feature_os_fotos:     'off',
}

// Cache de módulo — compartilhado entre todos os componentes
let _cache   = null
let _promise = null

async function fetchConfig() {
  if (_cache) return _cache
  if (!_promise) {
    _promise = import('../lib/supabase')
      .then(({ supabase }) =>
        supabase.from('app_config').select('key, value')
          .then(({ data, error }) => {
            if (error || !data?.length) {
              _cache = { ...CONFIG_DEFAULTS }
            } else {
              _cache = {
                ...CONFIG_DEFAULTS,
                ...Object.fromEntries(data.map(r => [r.key, r.value])),
              }
            }
            return _cache
          })
          .catch(() => { _cache = { ...CONFIG_DEFAULTS }; return _cache })
      )
      .catch(() => { _cache = { ...CONFIG_DEFAULTS }; return _cache })
  }
  return _promise
}

/** Chame após salvar no admin para forçar reload na próxima leitura */
export function invalidateConfig() {
  _cache   = null
  _promise = null
}

/** Hook principal — retorna defaults imediatamente, atualiza após fetch */
export function useConfig() {
  const [config, setConfig] = useState(_cache || CONFIG_DEFAULTS)

  useEffect(() => {
    let active = true
    fetchConfig().then(cfg => { if (active) setConfig(cfg) })
    return () => { active = false }
  }, [])

  return config
}

/** Helpers de formatação */
export const fmtBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
