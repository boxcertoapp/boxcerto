// ============================================================
// OsVistoria — vistoria de entrada dentro da OS (dono e técnico)
// Rascunho editável → "Finalizar" sela (imutável no banco). Correção
// posterior = adendo. Fotos reusam a compressão/cota das fotos da OS.
// Props: { os, ownerId, criadoPor }
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShieldCheck, Camera, X, Plus, Lock, AlertCircle, HardDrive, Check,
  Loader2, Eye, EyeOff, FileText,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../../components/Toast'
import {
  ANGULOS, COMBUSTIVEL, ITENS, MAX_AVARIAS, QUOTA_BYTES, MAX_FILE_BYTES, fmtMB,
  processarFoto, subirFotoVistoria, apagarFotoVistoria, urlsAssinadas, recalcularUso, vistoriaVazia,
} from '../../lib/vistoria'

const clone = (o) => JSON.parse(JSON.stringify(o))

export default function OsVistoria({ os, ownerId, criadoPor }) {
  const [v,        setV]        = useState(os.vistoria || null)
  const [thumbs,   setThumbs]   = useState({})
  const [uso,      setUso]      = useState(null)
  const [alvo,     setAlvo]     = useState(null)   // { tipo:'guiada'|'avaria', angulo? }
  const [enviando, setEnviando] = useState(false)
  const [erro,     setErro]     = useState('')
  const [confirmSelar, setConfirmSelar] = useState(false)
  const [addAdendo,   setAddAdendo]   = useState(false)
  const [adendoTexto, setAdendoTexto] = useState('')
  const inputRef = useRef(null)

  const selada = v?.status === 'selada'

  // ── Thumbs assinados (guiadas + avarias) ───────────────────
  useEffect(() => {
    if (!v) return
    const paths = []
    for (const a of ANGULOS) { const f = v.laudo.guiadas?.[a.key]; if (f?.thumb) paths.push(f.thumb) }
    for (const f of (v.laudo.avarias || [])) if (f?.thumb) paths.push(f.thumb)
    let vivo = true
    if (paths.length) urlsAssinadas(paths).then(map => { if (vivo) setThumbs(prev => ({ ...prev, ...map })) })
    return () => { vivo = false }
  }, [v])

  useEffect(() => {
    let vivo = true
    recalcularUso(ownerId).then(b => { if (vivo) setUso(b) })
    return () => { vivo = false }
  }, [ownerId])

  // ── Persistência ───────────────────────────────────────────
  const persistir = useCallback(async (nova) => {
    setV(nova)
    const { error } = await supabase.from('service_orders').update({ vistoria: nova }).eq('id', os.id)
    if (error) { showToast(error.message || 'Erro ao salvar vistoria.', 'warning'); return false }
    recalcularUso(ownerId).then(setUso)
    return true
  }, [os.id, ownerId])

  const iniciar = () => persistir(vistoriaVazia(os.km ? Number(String(os.km).replace(/\D/g, '')) || null : null))

  // ── Upload ─────────────────────────────────────────────────
  const abrirPicker = (tipo, angulo) => {
    if (selada || enviando) return
    setAlvo({ tipo, angulo })
    inputRef.current?.click()   // síncrono: preserva o gesto do usuário
  }

  const aoEscolher = async (fileList) => {
    const file = (fileList || [])[0]
    if (!file || !v || !alvo) return
    setErro(''); setEnviando(true)
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('Arquivo muito grande. Envie uma foto comum do celular.')
      const processed = await processarFoto(file)
      const tam = processed.fullBlob.size + processed.thumbBlob.size
      const usoAtual = uso ?? (await recalcularUso(ownerId))
      if (usoAtual + tam > QUOTA_BYTES) { setErro('upgrade'); return }
      const foto = await subirFotoVistoria({ userId: ownerId, osId: os.id, processed, criadoPor })
      const nova = clone(v)
      if (alvo.tipo === 'guiada') nova.laudo.guiadas[alvo.angulo] = foto
      else nova.laudo.avarias = [...(nova.laudo.avarias || []), foto]
      await persistir(nova)
    } catch (e) {
      showToast(e.message || 'Erro ao enviar foto.', 'warning')
    } finally {
      setEnviando(false); setAlvo(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removerGuiada = async (angulo) => {
    if (selada) return
    const f = v.laudo.guiadas?.[angulo]; if (f) await apagarFotoVistoria(f)
    const nova = clone(v); delete nova.laudo.guiadas[angulo]; await persistir(nova)
  }
  const removerAvaria = async (idx) => {
    if (selada) return
    const f = v.laudo.avarias[idx]; if (f) await apagarFotoVistoria(f)
    const nova = clone(v); nova.laudo.avarias.splice(idx, 1); await persistir(nova)
  }

  const editarLaudo = (fn) => { if (selada) return; const nova = clone(v); fn(nova.laudo); persistir(nova) }
  const toggleCiente = () => { const nova = clone(v); nova.visivel_cliente = !nova.visivel_cliente; persistir(nova) }

  const selar = async () => {
    setConfirmSelar(false)
    const nova = clone(v)
    nova.status = 'selada'
    nova.laudo.selada_em  = new Date().toISOString()
    nova.laudo.selada_por = criadoPor || null
    await persistir(nova)
  }

  const salvarAdendo = async () => {
    const t = adendoTexto.trim(); if (!t) return
    const nova = clone(v)
    nova.adendos = [...(nova.adendos || []), { em: new Date().toISOString(), por: criadoPor || null, texto: t }]
    const ok = await persistir(nova)
    if (ok) { setAdendoTexto(''); setAddAdendo(false) }
  }

  // ── Render ─────────────────────────────────────────────────
  const pctUso = uso != null ? Math.min(100, (uso / QUOTA_BYTES) * 100) : 0
  const cheio  = uso != null && uso >= QUOTA_BYTES

  const Slot = ({ foto, onAdd, onRemove, label, ativo }) => (
    <div className="flex flex-col items-center gap-1">
      {foto ? (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
          {thumbs[foto.thumb]
            ? <img src={thumbs[foto.thumb]} alt={label} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Camera className="w-4 h-4 text-slate-300" /></div>}
          {!selada && (
            <button onClick={onRemove} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/55 flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      ) : (
        <button onClick={onAdd} disabled={selada || enviando}
          className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-slate-400 disabled:opacity-50 enabled:hover:border-indigo-400 enabled:hover:text-indigo-500 transition-colors">
          {ativo && enviando ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Camera className="w-4 h-4" />}
        </button>
      )}
      {label && <span className="text-[9px] text-slate-400 leading-none text-center">{label}</span>}
    </div>
  )

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700">Vistoria de entrada</span>
          {v && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {selada ? 'Selada' : 'Rascunho'}
            </span>
          )}
        </div>
        {v && uso != null && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <HardDrive className="w-3 h-3" />{fmtMB(uso)} / {fmtMB(QUOTA_BYTES)} MB
          </div>
        )}
      </div>

      {!v ? (
        /* Estado inicial */
        <div className="px-4 pb-4">
          <button onClick={iniciar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Camera className="w-4 h-4" /> Fazer vistoria de entrada
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">Registre o estado do veículo com fotos.</p>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-4">
          {/* Barra de uso */}
          {uso != null && (
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pctUso > 90 ? 'bg-red-400' : pctUso > 70 ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ width: `${pctUso}%` }} />
            </div>
          )}
          {erro === 'upgrade' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Seu espaço de fotos está cheio (500 MB)</p>
              <p className="text-xs text-amber-700 mt-1">Em breve teremos planos com mais espaço. Por enquanto, apague fotos antigas para liberar.</p>
            </div>
          )}
          {erro && erro !== 'upgrade' && (
            <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {erro}</p>
          )}

          {/* km + combustível */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Combustível
              {v.laudo.km != null && <span className="ml-2 font-normal normal-case text-slate-400">· km na entrada: {Number(v.laudo.km).toLocaleString('pt-BR')}</span>}
            </p>
            <div className="flex gap-1.5">
              {COMBUSTIVEL.map(c => (
                <button key={c} onClick={() => editarLaudo(l => { l.combustivel = c })} disabled={selada}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${v.laudo.combustivel === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-500'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Fotos guiadas */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fotos guiadas</p>
            <div className="grid grid-cols-5 gap-1.5">
              {ANGULOS.map(a => (
                <Slot key={a.key} label={a.label} foto={v.laudo.guiadas?.[a.key]}
                  ativo={alvo?.tipo === 'guiada' && alvo?.angulo === a.key}
                  onAdd={() => abrirPicker('guiada', a.key)} onRemove={() => removerGuiada(a.key)} />
              ))}
            </div>
          </div>

          {/* Avarias */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Avarias · {(v.laudo.avarias || []).length}/{MAX_AVARIAS}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {(v.laudo.avarias || []).map((f, i) => (
                <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                  {thumbs[f.thumb]
                    ? <img src={thumbs[f.thumb]} alt="Avaria" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Camera className="w-4 h-4 text-slate-300" /></div>}
                  {!selada && (
                    <button onClick={() => removerAvaria(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/55 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
              {!selada && (v.laudo.avarias || []).length < MAX_AVARIAS && !cheio && (
                <button onClick={() => abrirPicker('avaria')} disabled={enviando}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-slate-400 disabled:opacity-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                  {alvo?.tipo === 'avaria' && enviando ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Itens no veículo</p>
            <div className="flex flex-wrap gap-1.5">
              {ITENS.map(it => {
                const on = !!v.laudo.itens?.[it.key]
                return (
                  <button key={it.key} onClick={() => editarLaudo(l => { l.itens = { ...l.itens, [it.key]: !on } })} disabled={selada}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${on ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-slate-400'}`}>
                    {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {it.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Observações</p>
            <textarea value={v.laudo.observacoes || ''} onChange={e => editarLaudo(l => { l.observacoes = e.target.value })}
              disabled={selada} rows={2} placeholder="Ex: risco na porta diant. direita; para-choque com folga."
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-indigo-400 disabled:bg-gray-100 disabled:text-slate-500 resize-none" />
          </div>

          {/* Rodapé: rascunho vs selada */}
          {!selada ? (
            <>
              <button onClick={toggleCiente}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-gray-200">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  {v.visivel_cliente ? <Eye className="w-4 h-4 text-indigo-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  Pedir ciente ao cliente
                </span>
                <span className={`w-9 h-5 rounded-full relative transition-colors ${v.visivel_cliente ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${v.visivel_cliente ? 'right-0.5' : 'left-0.5'}`} />
                </span>
              </button>

              {confirmSelar ? (
                <div className="bg-white border border-indigo-200 rounded-xl p-3">
                  <p className="text-xs text-slate-600 mb-2.5">Finalizar trava a vistoria — depois só dá pra adicionar adendo, não editar. Confirmar?</p>
                  <div className="flex gap-2">
                    <button onClick={selar} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Sim, finalizar</button>
                    <button onClick={() => setConfirmSelar(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-slate-600 text-sm font-semibold">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmSelar(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors">
                  <Lock className="w-4 h-4" /> Finalizar vistoria
                </button>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Selada em {new Date(v.laudo.selada_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <button onClick={toggleCiente}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  {v.visivel_cliente ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  Cliente vê no link de aprovação
                </span>
                <span className={`w-8 h-4 rounded-full relative transition-colors ${v.visivel_cliente ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${v.visivel_cliente ? 'right-0.5' : 'left-0.5'}`} />
                </span>
              </button>
              {(v.adendos || []).length > 0 && (
                <div className="space-y-1.5">
                  {v.adendos.map((a, i) => (
                    <div key={i} className="text-xs bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                      <p className="text-amber-800">{a.texto}</p>
                      <p className="text-amber-500 text-[10px] mt-0.5">Adendo · {new Date(a.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              )}
              {addAdendo ? (
                <div>
                  <textarea value={adendoTexto} onChange={e => setAdendoTexto(e.target.value)} rows={2}
                    placeholder="O que mudou ou foi encontrado depois de selada."
                    className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none" />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={salvarAdendo} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">Salvar adendo</button>
                    <button onClick={() => { setAddAdendo(false); setAdendoTexto('') }} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-600 text-xs font-semibold">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddAdendo(true)} className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar adendo
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* sem capture → celular oferece câmera E galeria; PC abre arquivos */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => aoEscolher(e.target.files)} />
    </div>
  )
}
