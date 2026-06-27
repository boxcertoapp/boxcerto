// ============================================================
// fotos.js — fotos da OS: compressão no navegador + Supabase Storage
//
// Tudo roda no browser: decodifica, corrige orientação, redimensiona,
// gera thumbnail, e sobe direto pro Storage. Vercel não encosta.
// ============================================================
import { supabase } from './supabase'

export const MAX_FOTOS       = 10
export const QUOTA_BYTES     = 500 * 1024 * 1024      // 500 MB por usuário (v1)
export const MAX_FILE_BYTES  = 25 * 1024 * 1024       // recusa arquivos absurdos antes de comprimir
export const ETIQUETAS_PADRAO = ['Antes', 'Depois', 'Avaria']

const BUCKET     = 'os-fotos'
const BUCKET_PUB = 'os-fotos-pub'
const FULL_DIM   = 1600, FULL_Q  = 0.75
const THUMB_DIM  = 300,  THUMB_Q = 0.7

// ── Helpers de formatação ────────────────────────────────────
export function fmtMB(bytes) {
  const mb = (bytes || 0) / (1024 * 1024)
  return mb < 10 ? mb.toFixed(1) : Math.round(mb).toString()
}

// ── Decodificação (trata orientação EXIF; fallback p/ <img>) ──
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch {}
    try { return await createImageBitmap(file) } catch {}
  }
  return await new Promise((res, rej) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload  = () => { URL.revokeObjectURL(url); res(img) }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')) }
    img.src = url
  })
}

function blobFromCanvas(canvas, q) {
  return new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', q))
}

function drawScaled(src, maxDim) {
  const sw = src.width, sh = src.height
  const scale = Math.min(1, maxDim / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(src, 0, 0, w, h)
  return { canvas, w, h }
}

// Decodifica uma vez → gera comprimida (1600px) + thumbnail (300px).
export async function processarFoto(file) {
  let src
  try {
    src = await decode(file)
  } catch {
    throw new Error('Não consegui ler essa imagem neste navegador (formato como HEIC do iPhone pode não abrir fora do Safari). Tente JPG ou PNG.')
  }
  const full  = drawScaled(src, FULL_DIM)
  const thumb = drawScaled(src, THUMB_DIM)
  src.close?.()
  const fullBlob  = await blobFromCanvas(full.canvas,  FULL_Q)
  const thumbBlob = await blobFromCanvas(thumb.canvas, THUMB_Q)
  return { fullBlob, thumbBlob, w: full.w, h: full.h }
}

// ── Upload (bucket privado) — recebe a imagem JÁ processada ───
// (a checagem de cota acontece antes, com o tamanho real comprimido)
export async function subirFoto({ userId, osId, processed, criadoPor }) {
  const { fullBlob, thumbBlob, w, h } = processed
  const id    = crypto.randomUUID()
  const path  = `${userId}/${osId}/${id}.jpg`
  const thumb = `${userId}/${osId}/${id}_t.jpg`

  const up1 = await supabase.storage.from(BUCKET).upload(path, fullBlob, { contentType: 'image/jpeg' })
  if (up1.error) throw new Error(up1.error.message)
  const up2 = await supabase.storage.from(BUCKET).upload(thumb, thumbBlob, { contentType: 'image/jpeg' })
  if (up2.error) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
    throw new Error(up2.error.message)
  }

  return {
    id, path, thumb, pub: null,
    visivel_cliente: false, etiqueta: null,
    w, h, size_bytes: fullBlob.size + thumbBlob.size,
    criado_por: criadoPor || null,
    criado_em: new Date().toISOString(),
  }
}

// ── Visibilidade pro cliente (copia/remove do bucket público) ─
// Publicar: baixa a comprimida do bucket privado e sobe no público.
export async function definirVisibilidade(foto, visivel, userId) {
  if (visivel && !foto.pub) {
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(foto.path, 120)
    if (signed.error) throw new Error(signed.error.message)
    const blob = await (await fetch(signed.data.signedUrl)).blob()
    const pubPath = `${userId}/${foto.id}.jpg`
    // Sem upsert (igual ao upload privado, que funciona). Limpa órfão antes
    // pra um INSERT limpo — o upsert batia num caminho de RLS no servidor.
    await supabase.storage.from(BUCKET_PUB).remove([pubPath]).catch(() => {})
    const up = await supabase.storage.from(BUCKET_PUB).upload(pubPath, blob, { contentType: 'image/jpeg' })
    if (up.error) throw new Error(up.error.message)
    return { ...foto, visivel_cliente: true, pub: pubPath }
  }
  if (!visivel && foto.pub) {
    await supabase.storage.from(BUCKET_PUB).remove([foto.pub]).catch(() => {})
    return { ...foto, visivel_cliente: false, pub: null }
  }
  return { ...foto, visivel_cliente: visivel }
}

// ── Apagar (privado full+thumb e público se houver) ──────────
export async function apagarFoto(foto) {
  const alvos = [foto.path, foto.thumb].filter(Boolean)
  if (alvos.length) await supabase.storage.from(BUCKET).remove(alvos).catch(() => {})
  if (foto.pub)     await supabase.storage.from(BUCKET_PUB).remove([foto.pub]).catch(() => {})
}

// ── URLs ─────────────────────────────────────────────────────
// Assinadas (privado) em lote — { path: url }
export async function urlsAssinadas(paths) {
  const out = {}
  const lista = (paths || []).filter(Boolean)
  if (!lista.length) return out
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(lista, 3600)
  for (const item of (data || [])) {
    if (item.signedUrl) out[item.path] = item.signedUrl
  }
  return out
}

// URL pública (cliente) a partir do caminho pub
export function urlPublica(pubPath) {
  if (!pubPath) return null
  return supabase.storage.from(BUCKET_PUB).getPublicUrl(pubPath).data.publicUrl
}

// ── Cota ─────────────────────────────────────────────────────
// Recalcula o uso real (soma exata) e atualiza o cache. Retorna bytes.
export async function recalcularUso(userId) {
  try {
    const { data, error } = await supabase.rpc('fotos_recalc_usage', { p_user: userId })
    if (!error && typeof data === 'number') return data
  } catch {}
  // fallback: lê o cache
  const { data } = await supabase.from('profiles').select('fotos_bytes').eq('id', userId).maybeSingle()
  return Number(data?.fotos_bytes || 0)
}
