// ── FipeSeletor.jsx ────────────────────────────────────────
// Busca assistida de veículos via API FIPE (parallelum)
// Fluxo: Tipo → Marca → Ano → Modelo (busca) → [Combustível se ambíguo]
// Props:
//   onSelect(string) — ex: "Honda CG 160 Fan 2022 Gasolina"
//   onCancel()       — usuário prefere digitar manualmente
import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Car, Bike, Truck } from 'lucide-react'

const FIPE_BASE = 'https://parallelum.com.br/fipe/api/v1'

const TIPOS = [
  { id: 'motos',     label: 'Moto',    Icon: Bike  },
  { id: 'carros',    label: 'Carro',   Icon: Car   },
  { id: 'caminhoes', label: 'Caminhão',Icon: Truck },
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

// extrai ano numérico de strings como "2022 Gasolina" ou "32000-0 Zero KM"
function extrairAno(nome) {
  const match = nome.match(/^(\d{4})/)
  return match ? match[1] : null
}

export default function FipeSeletor({ onSelect, onCancel }) {
  const [tipo,        setTipo]        = useState('motos')
  const [marcas,      setMarcas]      = useState([])
  const [marca,       setMarca]       = useState(null)
  const [anosDisp,    setAnosDisp]    = useState([])   // anos únicos da marca
  const [todosModelos,setTodosModelos]= useState([])   // todos os modelos da marca
  const [anoSel,      setAnoSel]      = useState('')   // ex: "2022"
  const [filtro,      setFiltro]      = useState('')
  const [modelo,      setModelo]      = useState(null)
  const [combDisp,    setCombDisp]    = useState([])   // combustíveis para o ano+modelo
  const [combSel,     setCombSel]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [erro,        setErro]        = useState('')
  const filtroRef = useRef(null)

  // ── 1. Carrega marcas ao mudar tipo ──────────────────────
  useEffect(() => {
    setLoading(true); setErro('')
    setMarca(null); setAnosDisp([]); setTodosModelos([])
    setAnoSel(''); setFiltro(''); setModelo(null)
    setCombDisp([]); setCombSel(null)
    fipeGet(`/${tipo}/marcas`)
      .then(setMarcas)
      .catch(() => setErro('Não foi possível carregar as marcas.'))
      .finally(() => setLoading(false))
  }, [tipo])

  // ── 2. Carrega modelos + anos da marca ────────────────────
  useEffect(() => {
    if (!marca) return
    setLoading(true); setErro('')
    setAnosDisp([]); setTodosModelos([])
    setAnoSel(''); setFiltro(''); setModelo(null)
    setCombDisp([]); setCombSel(null)
    fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos`)
      .then(data => {
        setTodosModelos(data.modelos || [])
        // extrai anos únicos e ordena do mais recente
        const anosUnicos = [...new Set(
          (data.anos || [])
            .map(a => extrairAno(a.nome))
            .filter(Boolean)
        )].sort((a, b) => b - a)
        setAnosDisp(anosUnicos)
      })
      .catch(() => setErro('Não foi possível carregar os modelos.'))
      .finally(() => setLoading(false))
  }, [marca])

  // ── 3. Ao selecionar modelo, busca anos daquele modelo ───
  useEffect(() => {
    if (!modelo || !marca || !anoSel) return
    setLoading(true); setErro('')
    setCombDisp([]); setCombSel(null)
    fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos/${modelo.codigo}/anos`)
      .then(anosModelo => {
        // filtra apenas entradas do ano selecionado
        const matches = anosModelo.filter(a => a.nome.startsWith(anoSel))
        if (matches.length === 0) {
          setErro(`Modelo "${modelo.nome}" não disponível em ${anoSel}. Escolha outro modelo.`)
          setModelo(null); setFiltro('')
        } else if (matches.length === 1) {
          setCombSel(matches[0]) // único combustível → confirma direto
        } else {
          setCombDisp(matches) // mais de um combustível → mostra select
        }
      })
      .catch(() => setErro('Não foi possível validar o ano/combustível.'))
      .finally(() => setLoading(false))
  }, [modelo])

  const confirmar = () => {
    const comb = combSel || combDisp.find(c => c.codigo === combSel?.codigo)
    if (!marca || !modelo || !comb) return
    const partes  = comb.nome.split(' ')
    const anoStr  = partes[0]
    const combStr = partes.slice(1).join(' ')
    onSelect(`${marca.nome} ${modelo.nome} ${anoStr}${combStr ? ' ' + combStr : ''}`)
  }

  const resetModelo = () => {
    setModelo(null); setFiltro('')
    setCombDisp([]); setCombSel(null); setErro('')
    setTimeout(() => filtroRef.current?.focus(), 50)
  }

  // filtra modelos pelo texto digitado
  const filtrados = todosModelos.filter(m =>
    m.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  const podeConfirmar = marca && modelo && (combSel || combDisp.length === 0)

  const sel = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm bg-white'
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm'

  return (
    <div className="space-y-3 bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100">

      {/* Tipo */}
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

      {/* Ano — aparece após carregar modelos da marca */}
      {anosDisp.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ano</label>
          <select value={anoSel}
            onChange={e => {
              setAnoSel(e.target.value)
              setModelo(null); setFiltro('')
              setCombDisp([]); setCombSel(null); setErro('')
              if (e.target.value) setTimeout(() => filtroRef.current?.focus(), 50)
            }} className={sel}>
            <option value="">Selecione o ano...</option>
            {anosDisp.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Modelo — aparece após selecionar ano */}
      {anoSel && todosModelos.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Modelo <span className="text-slate-400 font-normal">({todosModelos.length} disponíveis)</span>
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
                placeholder="Digite para filtrar modelos..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className={inp}
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

      {/* Combustível — só aparece quando há mais de uma opção */}
      {combDisp.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Combustível</label>
          <select value={combSel?.codigo || ''}
            onChange={e => {
              const c = combDisp.find(c => c.codigo === e.target.value)
              setCombSel(c || null)
            }} className={sel}>
            <option value="">Selecione o combustível...</option>
            {combDisp.map(c => (
              <option key={c.codigo} value={c.codigo}>{c.nome.split(' ').slice(1).join(' ')}</option>
            ))}
          </select>
        </div>
      )}

      {/* Prévia do resultado */}
      {modelo && (combSel || combDisp.length === 1) && (() => {
        const comb = combSel || combDisp[0]
        const partes = comb?.nome.split(' ') || []
        const preview = `${marca?.nome} ${modelo.nome} ${partes[0] || anoSel}${partes.length > 1 ? ' ' + partes.slice(1).join(' ') : ''}`
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <p className="text-xs text-green-600 font-medium">✓ Veículo selecionado</p>
            <p className="text-sm font-bold text-green-800 truncate">{preview}</p>
          </div>
        )
      })()}

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
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-600 font-medium hover:bg-gray-50 transition-colors">
          Digitar manualmente
        </button>
        <button type="button" onClick={confirmar} disabled={!podeConfirmar}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
          Confirmar
        </button>
      </div>
    </div>
  )
}
