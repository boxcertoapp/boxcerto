// ============================================================
// vistoria.js — vistoria de entrada do veículo
//
// Reusa a infra das fotos da OS: compressão no navegador (fotos.js),
// buckets e cota de 500 MB. Fotos vão na subpasta {user}/{os}/vistoria,
// então contam na cota da oficina, mas NÃO no limite de 10 fotos da OS.
// ============================================================
import { supabase } from './supabase'
import {
  processarFoto, urlsAssinadas, recalcularUso,
  QUOTA_BYTES, MAX_FILE_BYTES, fmtMB,
} from './fotos'

const BUCKET = 'os-fotos'

export const MAX_AVARIAS = 10
export const ANGULOS = [
  { key: 'frente',   label: 'Frente' },
  { key: 'traseira', label: 'Traseira' },
  { key: 'lat_esq',  label: 'Lat. esquerda' },
  { key: 'lat_dir',  label: 'Lat. direita' },
  { key: 'painel',   label: 'Painel' },
]
export const COMBUSTIVEL = ['E', '¼', '½', '¾', 'F']
export const ITENS = [
  { key: 'estepe',     label: 'Estepe' },
  { key: 'macaco',     label: 'Macaco' },
  { key: 'chave_roda', label: 'Chave de roda' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'som',        label: 'Som/multimídia' },
  { key: 'tapetes',    label: 'Tapetes' },
]

// Reexporta o que o componente usa (mesma origem das fotos)
export { processarFoto, urlsAssinadas, recalcularUso, QUOTA_BYTES, MAX_FILE_BYTES, fmtMB }

// ── Upload de foto da vistoria (subpasta /vistoria) ──────────
export async function subirFotoVistoria({ userId, osId, processed, criadoPor }) {
  const { fullBlob, thumbBlob, w, h } = processed
  const id    = crypto.randomUUID()
  const base  = `${userId}/${osId}/vistoria`
  const path  = `${base}/${id}.jpg`
  const thumb = `${base}/${id}_t.jpg`

  const up1 = await supabase.storage.from(BUCKET).upload(path, fullBlob, { contentType: 'image/jpeg' })
  if (up1.error) throw new Error(up1.error.message)
  const up2 = await supabase.storage.from(BUCKET).upload(thumb, thumbBlob, { contentType: 'image/jpeg' })
  if (up2.error) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
    throw new Error(up2.error.message)
  }

  return {
    id, path, thumb, w, h,
    size_bytes: fullBlob.size + thumbBlob.size,
    criado_por: criadoPor || null,
    criado_em: new Date().toISOString(),
  }
}

export async function apagarFotoVistoria(foto) {
  const alvos = [foto?.path, foto?.thumb].filter(Boolean)
  if (alvos.length) await supabase.storage.from(BUCKET).remove(alvos).catch(() => {})
}

// ── Objeto de vistoria em rascunho (vazio) ───────────────────
export function vistoriaVazia(km) {
  return {
    status: 'rascunho',
    visivel_cliente: false,
    laudo: {
      km: km ?? null,
      combustivel: null,
      itens: {},
      observacoes: '',
      guiadas: {},
      avarias: [],
      selada_em: null,
      selada_por: null,
    },
    ciente: null,
    adendos: [],
  }
}
