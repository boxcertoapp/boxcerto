// ============================================================
// OsFotos — seção de fotos dentro da OS (dono e técnico)
// Compressão no navegador → Supabase Storage. Reutilizável.
// Props: os, ownerId (id do dono p/ caminho/cota), criadoPor (auth uid)
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, Image as ImageIcon, X, Eye, EyeOff, Trash2,
  Loader2, Plus, Check, ChevronLeft, ChevronRight, Tag, AlertCircle, HardDrive,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../../components/Toast'
import {
  MAX_FOTOS, QUOTA_BYTES, ETIQUETAS_PADRAO, fmtMB,
  processarFoto, subirFoto, definirVisibilidade, apagarFoto,
  urlsAssinadas, recalcularUso,
} from '../../lib/fotos'

export default function OsFotos({ os, ownerId, criadoPor }) {
  const [fotos,    setFotos]    = useState(Array.isArray(os.fotos) ? os.fotos : [])
  const [thumbs,   setThumbs]   = useState({})        // path -> signedUrl
  const [uso,      setUso]      = useState(null)       // bytes usados
  const [enviando, setEnviando] = useState(0)          // qtd em upload
  const [lightbox, setLightbox] = useState(null)       // índice ou null
  const [erro,     setErro]     = useState('')
  const inputRef = useRef(null)

  const restantes = MAX_FOTOS - fotos.length
  const cheio     = uso != null && uso >= QUOTA_BYTES

  // ── Carrega thumbs assinados + uso da cota ─────────────────
  useEffect(() => {
    let vivo = true
    const paths = fotos.map(f => f.thumb).filter(Boolean)
    urlsAssinadas(paths).then(map => { if (vivo) setThumbs(prev => ({ ...prev, ...map })) })
    return () => { vivo = false }
  }, [fotos])

  useEffect(() => {
    let vivo = true
    recalcularUso(ownerId).then(b => { if (vivo) setUso(b) })
    return () => { vivo = false }
  }, [ownerId])

  // ── Persiste o array na OS + recalcula a cota ──────────────
  const persistir = useCallback(async (novas) => {
    setFotos(novas)
    const { error } = await supabase.from('service_orders').update({ fotos: novas }).eq('id', os.id)
    if (error) { showToast('Erro ao salvar fotos.', 'warning'); return }
    const b = await recalcularUso(ownerId)
    setUso(b)
  }, [os.id, ownerId])

  // ── Adicionar (comprime → checa cota → sobe) ───────────────
  const adicionar = async (fileList) => {
    setErro('')
    const arquivos = Array.from(fileList || []).slice(0, restantes)
    if (!arquivos.length) return
    if (restantes <= 0) { setErro(`Limite de ${MAX_FOTOS} fotos por OS atingido.`); return }

    let usoAtual = uso ?? (await recalcularUso(ownerId))
    const novas = [...fotos]

    for (const file of arquivos) {
      setEnviando(e => e + 1)
      try {
        const processed = await processarFoto(file)
        const tamanho = processed.fullBlob.size + processed.thumbBlob.size
        if (usoAtual + tamanho > QUOTA_BYTES) {
          setErro('upgrade')   // marca p/ mostrar o aviso de espaço
          setEnviando(e => e - 1)
          break
        }
        const foto = await subirFoto({ userId: ownerId, osId: os.id, processed, criadoPor })
        novas.push(foto)
        usoAtual += tamanho
        await persistir([...novas])
      } catch (e) {
        showToast(e.message || 'Erro ao enviar foto.', 'warning')
      } finally {
        setEnviando(e => e - 1)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Ações por foto ─────────────────────────────────────────
  const toggleVisivel = async (idx) => {
    const f = fotos[idx]
    try {
      const atualizada = await definirVisibilidade(f, !f.visivel_cliente, ownerId)
      const novas = fotos.map((x, i) => i === idx ? atualizada : x)
      await persistir(novas)
    } catch (e) { showToast(e.message || 'Erro ao alterar visibilidade.', 'warning') }
  }

  const definirEtiqueta = async (idx, etiqueta) => {
    const novas = fotos.map((x, i) => i === idx ? { ...x, etiqueta: etiqueta || null } : x)
    await persistir(novas)
  }

  const remover = async (idx) => {
    const f = fotos[idx]
    await apagarFoto(f)
    const novas = fotos.filter((_, i) => i !== idx)
    await persistir(novas)
    setLightbox(null)
  }

  // ── Render ─────────────────────────────────────────────────
  const pctUso = uso != null ? Math.min(100, (uso / QUOTA_BYTES) * 100) : 0

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700">Fotos</span>
          <span className="text-xs text-slate-400">{fotos.length}/{MAX_FOTOS}</span>
        </div>
        {uso != null && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <HardDrive className="w-3 h-3" />
            {fmtMB(uso)} / {fmtMB(QUOTA_BYTES)} MB
          </div>
        )}
      </div>

      {/* Barra de uso */}
      {uso != null && (
        <div className="px-4 -mt-1 mb-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pctUso > 90 ? 'bg-red-400' : pctUso > 70 ? 'bg-amber-400' : 'bg-indigo-400'}`}
              style={{ width: `${pctUso}%` }} />
          </div>
        </div>
      )}

      {/* Aviso de cota cheia (gancho de upgrade) */}
      {erro === 'upgrade' && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Seu espaço de fotos está cheio (500 MB)
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Em breve teremos planos com mais armazenamento. Por enquanto, apague fotos antigas para liberar espaço.
          </p>
        </div>
      )}
      {erro && erro !== 'upgrade' && (
        <p className="mx-4 mb-3 text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {erro}</p>
      )}

      {/* Grid */}
      <div className="px-4 pb-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {fotos.map((f, idx) => (
          <button key={f.id} onClick={() => setLightbox(idx)}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group">
            {thumbs[f.thumb]
              ? <img src={thumbs[f.thumb]} alt={f.etiqueta || 'Foto da OS'} className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-300" /></div>}
            {f.visivel_cliente && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-600/90 flex items-center justify-center" title="Visível pro cliente">
                <Eye className="w-3 h-3 text-white" />
              </span>
            )}
            {f.etiqueta && (
              <span className="absolute bottom-1 left-1 right-1 text-[9px] font-semibold text-white bg-black/55 rounded px-1 py-0.5 truncate text-center">
                {f.etiqueta}
              </span>
            )}
          </button>
        ))}

        {/* Tiles de upload em progresso */}
        {Array.from({ length: enviando }).map((_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ))}

        {/* Botão adicionar */}
        {restantes > 0 && !cheio && (
          <button onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Foto</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple capture="environment"
        className="hidden" onChange={e => adicionar(e.target.files)} />

      {/* Lightbox */}
      {lightbox != null && fotos[lightbox] && (
        <Lightbox
          fotos={fotos}
          idx={lightbox}
          onIdx={setLightbox}
          onClose={() => setLightbox(null)}
          onToggleVisivel={() => toggleVisivel(lightbox)}
          onEtiqueta={(et) => definirEtiqueta(lightbox, et)}
          onRemover={() => remover(lightbox)}
        />
      )}
    </div>
  )
}

// ── Lightbox: foto cheia + etiqueta + visibilidade + apagar ──
function Lightbox({ fotos, idx, onIdx, onClose, onToggleVisivel, onEtiqueta, onRemover }) {
  const f = fotos[idx]
  const [url, setUrl] = useState(null)
  const [custom, setCustom] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    let vivo = true
    setUrl(null)
    urlsAssinadas([f.path]).then(map => { if (vivo) setUrl(map[f.path] || null) })
    return () => { vivo = false }
  }, [f.path])

  const etCustomAtiva = f.etiqueta && !ETIQUETAS_PADRAO.includes(f.etiqueta)

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 flex flex-col" onClick={onClose}>
      {/* Topo */}
      <div className="flex items-center justify-between p-4 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/70 text-xs font-mono">{idx + 1} / {fotos.length}</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
      </div>

      {/* Imagem */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative" onClick={e => e.stopPropagation()}>
        {idx > 0 && (
          <button onClick={() => onIdx(idx - 1)} className="absolute left-2 p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {url
          ? <img src={url} alt={f.etiqueta || 'Foto'} className="max-h-full max-w-full object-contain rounded-lg" />
          : <Loader2 className="w-7 h-7 text-white/60 animate-spin" />}
        {idx < fotos.length - 1 && (
          <button onClick={() => onIdx(idx + 1)} className="absolute right-2 p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Controles */}
      <div className="shrink-0 bg-white rounded-t-3xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
        {/* Etiquetas */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Etiqueta
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ETIQUETAS_PADRAO.map(et => (
              <button key={et} onClick={() => onEtiqueta(f.etiqueta === et ? null : et)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${f.etiqueta === et ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                {et}
              </button>
            ))}
            <form onSubmit={e => { e.preventDefault(); if (custom.trim()) { onEtiqueta(custom.trim()); setCustom('') } }}
              className="flex items-center gap-1">
              <input value={custom} onChange={e => setCustom(e.target.value)}
                placeholder={etCustomAtiva ? f.etiqueta : 'Outra…'} maxLength={24}
                className={`w-24 px-2 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-indigo-400 ${etCustomAtiva ? 'border-indigo-300 bg-indigo-50 text-indigo-700 placeholder-indigo-400' : 'border-gray-200'}`} />
              {custom.trim() && (
                <button type="submit" className="p-1.5 bg-indigo-100 rounded-lg"><Check className="w-3.5 h-3.5 text-indigo-600" /></button>
              )}
            </form>
          </div>
        </div>

        {/* Visível + apagar */}
        <div className="flex gap-2">
          <button onClick={onToggleVisivel}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${f.visivel_cliente ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
            {f.visivel_cliente ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {f.visivel_cliente ? 'Cliente vê esta foto' : 'Mostrar pro cliente'}
          </button>
          {confirmDel ? (
            <button onClick={onRemover}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
              <Trash2 className="w-4 h-4" /> Confirmar
            </button>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
