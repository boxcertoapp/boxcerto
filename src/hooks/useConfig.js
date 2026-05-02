// ============================================================
// useConfig.js — Configurações globais do BoxCerto
// Lê de app_config no Supabase com cache de módulo.
// Qualquer componente que chamar useConfig() recebe os preços
// e configurações atuais sem fazer requests duplicados.
// ============================================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Valores padrão caso o Supabase não esteja disponível
export const CONFIG_DEFAULTS = {
  price_monthly:        '97.00',
  price_annual:         '958.80',
  price_annual_monthly: '79.90',
  trial_days:           '7',
  trial_message:        'Experimente grátis por 7 dias, sem cartão necessário.',
}

// Cache de módulo — compartilhado entre todos os componentes
let _cache   = null
let _promise = null

async function fetchConfig() {
  if (_cache) return _cache
  if (!_promise) {
    _promise = supabase
      .from('app_config')
      .select('key, value')
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
      .catch(() => {
        _cache = { ...CONFIG_DEFAULTS }
        return _cache
      })
  }
  return _promise
}

/** Chame após salvar no admin para forçar reload na próxima leitura */
export function invalidateConfig() {
  _cache   = null
  _promise = null
}

/** Hook principal — retorna objeto de config com fallback para defaults */
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
