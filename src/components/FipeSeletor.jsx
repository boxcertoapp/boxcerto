// ── FipeSeletor.jsx ────────────────────────────────────────
// Busca assistida de veículos via API FIPE (parallelum)
// Fluxo: Tipo → Marca → Modelo (busca) → Ano/Combustível
// Props:
//   onSelect(string) — ex: "Honda CG 160 Fan 2022 Gasolina"
//   onManual()       — usuário prefere digitar manualmente
import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Car, Bike, Truck } from 'lucide-react'

const FIPE_BASE = 'https://parallelum.com.br/fipe/api/v1'

const TIPOS = [
  { id: 'carros',    label: 'Carro',    Icon: Car   },
  { id: 'motos',     label: 'Moto',     Icon: Bike  },
  { id: 'caminhoes', label: 'Caminhão', Icon: Truck },
]

const cache = {}
async function fipeGet(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(`${FIPE_BASE}${path}`)
  if (!res.ok) throw new Error('Erro FIPE')
  const json = await res.json()
  cache[path] = json
  return json
}

export default function FipeSeletor({ onSelect, onManual }) {
  const [tipo,    setTipo]    = useState('carros')
  const [marcas,  setMarcas]  = useState([])
  const [marca,   setMarca]   = useState(null)
  const [modelos, setModelos] = useState([])
  const [filtro,  setFiltro]  = useState('')
  const [modelo,  setModelo]  = useState(null)
  const [anos,    setAnos]    = useState([])
  const [ano,     setAno]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')
  const filtroRef = useRef(null)

  // ── Carrega marcas ao mudar tipo ──────────────────────────
  useEffect(() => {
    setLoading(true); setErro('')
    setMarca(null); setModelos([]); setModelo(null)
    setFiltro(''); setAnos([]); setAno(null)
    fipeGet(`/${tipo}/marcas`)
      .then(setMarcas)
      .catch(() => setErro('Não foi possível carregar as marcas.'))
      .finally(() => setLoading(false))
  }, [tipo])

  // ── Carrega modelos ao selecionar marca ───────────────────
  useEffect(() => {
    if (!marca) return
    setLoading(true); setErro('')
    setModelos([]); setModelo(null)
    setFiltro(''); setAnos([]); setAno(null)
    fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos`)
      .then(data => {
        setModelos(data.modelos || [])
        setTimeout(() => filtroRef.current?.focus(), 50)
      })
      .catch(() => setErro('Não foi possível carregar os modelos.'))
      .finally(() => setLoading(false))
  }, [marca])

  // ── Carrega anos ao selecionar modelo ─────────────────────
  // Apenas anos reais daquele modelo — sem possibilidade de escolha inválida
  useEffect(() => {
    if (!modelo || !marca) return
    setLoading(true); setErro('')
    setAnos([]); setAno(null)
    fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos/${modelo.codigo}/anos`)
      .then(setAnos)
      .catch(() => setErro('Não foi possível carregar os anos.'))
      .finally(() => setLoading(false))
  }, [modelo])

  const confirmar = () => {
    if (!marca || !modelo || !ano) return
    const partes  = ano.nome.split(' ')
    const anoStr  = partes[0]
    const combStr = partes.slice(1).join(' ')
    onSelect(`${marca.nome} ${modelo.nome} ${anoStr}${combStr ? ' ' + combStr : ''}`)
  }

  const resetModelo = () => {
    setModelo(null); setFiltro('')
    setAnos([]); setAno(null); setErro('')
    setTimeout(() => filtroRef.current?.focus(), 50)
  }

  const filtrados = modelos.filter(m =>
    m.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  // Prévia do resultado selecionado
  const preview = modelo && ano
    ? (() => {
        const p = ano.nome.split(' ')
        return `${marca.nome} ${modelo.nome} ${p[0]}${p.length > 1 ? ' ' + p.slice(1).join(' ') : ''}`
      })()
    : null

  const sel = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm bg-white'
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm'

  return (
    <div className="space-y-3 bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100">

      {/* Tipo: Carro > Moto > Caminhão */}
      <div className="flex gap-1.5">
        {TIPOS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setTipo(id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1
              ${tipo === id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-gray-200 hover:border-indigo-300'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Marca */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Marca</label>
        <select value={marca?.codigo || ''} disabled={loading && !marcas.length}
          onChange={e => {
            const m = marcas.find(m => String(m.codigo) === e.target.value)
            setMarca(m || null)
          }} className={sel}>
          <option value="">Selecione a marca...</option>
          {marcas.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
      </div>

      {/* Modelo — busca com autocomplete */}
      {marca && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Modelo
            {modelos.length > 0 && (
              <span className="text-slate-400 font-normal ml-1">({modelos.length} disponíveis)</span>
            )}
          </label>
          {modelo ? (
            <div className="flex items-center justify-between bg-white rounded-xl border border-indigo-300 px-3 py-2.5">
              <span className="text-sm font-semibold text-indigo-700 truncate">{modelo.nome}</span>
              <button type="button" onClick={resetModelo}
                className="ml-2 text-slate-400 hover:text-slate-600 shrink-0" title="Trocar modelo">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={filtroRef}
                type="text"
                placeholder={modelos.length ? 'Digite para filtrar...' : 'Carregando...'}
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className={inp}
                disabled={!modelos.length}
              />
              {filtro.length > 0 && (
                filtrados.length > 0 ? (
                  <div className="mt-1 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-50">
                    {filtrados.slice(0, 40).map(m => (
                      <button key={m.codigo} type="button"
                        onMouseDown={e => { e.preventDefault(); setModelo(m); setFiltro(m.nome) }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors">
                        {m.nome}
                      </button>
                    ))}
                    {filtrados.length > 40 && (
                      <p className="text-center text-xs text-slate-400 py-2">
                        +{filtrados.length - 40} resultados — refine a busca
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1 px-1">
                    Nenhum modelo encontrado. Tente outro termo.
                  </p>
                )
              )}
            </>
          )}
        </div>
      )}

      {/* Ano / Combustível — apenas anos reais daquele modelo */}
      {anos.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ano / Combustível</label>
          <select value={ano?.codigo || ''}
            onChange={e => {
              const a = anos.find(a => a.codigo === e.target.value)
              setAno(a || null)
            }} className={sel}>
            <option value="">Selecione o ano...</option>
            {anos.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
          </select>
        </div>
      )}

      {/* Prévia */}
      {preview && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <p className="text-xs text-green-600 font-medium">✓ Veículo selecionado</p>
          <p className="text-sm font-bold text-green-800 truncate">{preview}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-400">Carregando...</span>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{erro}</p>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onManual}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-600 font-medium hover:bg-gray-50 transition-colors">
          Digitar manualmente
        </button>
        <button type="button" onClick={confirmar} disabled={!marca || !modelo || !ano}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
          Confirmar
        </button>
      </div>
    </div>
  )
}
