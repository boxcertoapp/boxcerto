// ── FipeSeletor.jsx ────────────────────────────────────────
// Busca assistida via API FIPE — fluxo: Tipo → Marca → Ano → Modelo
// Ao selecionar a marca, carrega os anos de todos os modelos em background
// (batches de 30 calls paralelas). Ao escolher o ano, só aparecem modelos
// que realmente têm aquele ano cadastrado na FIPE.
// Props:
//   onSelect(string) — ex: "Honda CG 160 Fan 2022 Gasolina"
//   onManual()       — usuário prefere digitar manualmente
import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Car, Bike, Truck } from 'lucide-react'

const FIPE_BASE  = 'https://parallelum.com.br/fipe/api/v1'
const BATCH_SIZE = 30   // calls paralelas por rodada

const TIPOS = [
  { id: 'carros',    label: 'Carro',    Icon: Car   },
  { id: 'motos',     label: 'Moto',     Icon: Bike  },
  { id: 'caminhoes', label: 'Caminhão', Icon: Truck },
]

// cache global em memória (persiste durante a sessão)
const cache = {}
async function fipeGet(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(`${FIPE_BASE}${path}`)
  if (!res.ok) throw new Error('Erro FIPE')
  const json = await res.json()
  cache[path] = json
  return json
}

// extrai o número do ano de "2022 Gasolina" → "2022"
const extrairAno = str => (str.match(/^(\d{4})/) || [])[1] || null

export default function FipeSeletor({ onSelect, onManual }) {
  const [tipo,          setTipo]          = useState('carros')
  const [marcas,        setMarcas]        = useState([])
  const [marca,         setMarca]         = useState(null)
  const [modelos,       setModelos]       = useState([])
  const [anosDisponiveis, setAnosDisp]    = useState([])  // anos únicos da marca
  const [anosMap,       setAnosMap]       = useState({})  // { modeloCodigo: [anos] }
  const [progresso,     setProgresso]     = useState({ feito: 0, total: 0 })
  const [anoSel,        setAnoSel]        = useState('')
  const [filtro,        setFiltro]        = useState('')
  const [modelo,        setModelo]        = useState(null)
  const [combustiveis,  setCombustiveis]  = useState([])  // se > 1 para o ano escolhido
  const [combSel,       setCombSel]       = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [loadingAnos,   setLoadingAnos]   = useState(false)
  const [erro,          setErro]          = useState('')
  const abortRef  = useRef(null)   // controla cancelamento entre trocas de marca
  const filtroRef = useRef(null)

  // ── 1. Marcas ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true); setErro('')
    resetMarca()
    fipeGet(`/${tipo}/marcas`)
      .then(setMarcas)
      .catch(() => setErro('Não foi possível carregar as marcas.'))
      .finally(() => setLoading(false))
  }, [tipo])

  // ── 2. Modelos + carregamento de anos em background ───────
  useEffect(() => {
    if (!marca) return
    setLoading(true); setErro('')
    resetMarca(false)

    fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos`)
      .then(async data => {
        const listaModelos = data.modelos || []
        setModelos(listaModelos)

        // Anos únicos da marca (usado para o dropdown de ano enquanto carrega)
        const anosUnicos = [...new Set(
          (data.anos || []).map(a => extrairAno(a.nome)).filter(Boolean)
        )].sort((a, b) => b - a)
        setAnosDisp(anosUnicos)

        // Carrega anos de todos os modelos em background (batches paralelos)
        const id = Symbol()   // id único para esta execução
        abortRef.current = id
        setLoadingAnos(true)
        setProgresso({ feito: 0, total: listaModelos.length })

        const mapa = {}
        for (let i = 0; i < listaModelos.length; i += BATCH_SIZE) {
          if (abortRef.current !== id) break  // marca trocou, aborta
          const lote = listaModelos.slice(i, i + BATCH_SIZE)
          const resultados = await Promise.all(
            lote.map(m =>
              fipeGet(`/${tipo}/marcas/${marca.codigo}/modelos/${m.codigo}/anos`)
                .then(anos => ({ codigo: m.codigo, anos }))
                .catch(() => ({ codigo: m.codigo, anos: [] }))
            )
          )
          resultados.forEach(({ codigo, anos }) => { mapa[codigo] = anos })
          if (abortRef.current !== id) break
          setAnosMap({ ...mapa })
          setProgresso({ feito: Math.min(i + BATCH_SIZE, listaModelos.length), total: listaModelos.length })
        }
        if (abortRef.current === id) setLoadingAnos(false)
      })
      .catch(() => { setErro('Não foi possível carregar os modelos.'); setLoadingAnos(false) })
      .finally(() => setLoading(false))
  }, [marca])

  // ── 3. Ao selecionar modelo, monta combustíveis do ano ────
  useEffect(() => {
    if (!modelo || !anoSel) return
    const anos = anosMap[modelo.codigo] || []
    const matches = anos.filter(a => a.nome.startsWith(anoSel))
    if (matches.length === 1)      { setCombSel(matches[0]); setCombustiveis([]) }
    else if (matches.length > 1)   { setCombustiveis(matches); setCombSel(null) }
  }, [modelo, anoSel, anosMap])

  // ── Helpers ───────────────────────────────────────────────
  function resetMarca(full = true) {
    if (full) setMarca(null)
    setModelos([]); setAnosMap({}); setAnosDisp([])
    setAnoSel(''); setFiltro(''); setModelo(null)
    setCombustiveis([]); setCombSel(null); setErro('')
    setLoadingAnos(false); setProgresso({ feito: 0, total: 0 })
    abortRef.current = null
  }

  const resetModelo = () => {
    setModelo(null); setFiltro('')
    setCombustiveis([]); setCombSel(null)
    setTimeout(() => filtroRef.current?.focus(), 50)
  }

  const confirmar = () => {
    const comb = combSel || (combustiveis.length === 1 ? combustiveis[0] : null)
    if (!marca || !modelo || !comb) return
    const p    = comb.nome.split(' ')
    const ano  = p[0]
    const fuel = p.slice(1).join(' ')
    onSelect(`${marca.nome} ${modelo.nome} ${ano}${fuel ? ' ' + fuel : ''}`)
  }

  // Modelos filtrados pelo ano selecionado (somente os que já têm dados)
  const totalCarregado   = Object.keys(anosMap).length
  const carregamentoOk   = !loadingAnos || totalCarregado === modelos.length
  const pct              = modelos.length ? Math.round(totalCarregado / modelos.length * 100) : 0

  const modelosFiltradosAno = anoSel
    ? modelos.filter(m => {
        const anos = anosMap[m.codigo]
        if (!anos) return false   // ainda não carregou → não exibe
        return anos.some(a => a.nome.startsWith(anoSel))
      })
    : modelos

  const norm = str => (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const modelosVisiveis = modelosFiltradosAno.filter(m =>
    norm(m.nome).includes(norm(filtro))
  )

  const preview = modelo && combSel
    ? (() => {
        const p = combSel.nome.split(' ')
        return `${marca.nome} ${modelo.nome} ${p[0]}${p.length > 1 ? ' ' + p.slice(1).join(' ') : ''}`
      })()
    : null

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

      {/* Progresso do carregamento de anos */}
      {loadingAnos && modelos.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Mapeando modelos disponíveis... {pct}%
            </span>
            <span className="text-xs text-slate-300">{totalCarregado}/{modelos.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-indigo-400 h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Ano — disponível assim que tiver a lista de anos da marca */}
      {anosDisponiveis.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ano</label>
          <select value={anoSel}
            onChange={e => {
              setAnoSel(e.target.value)
              setModelo(null); setFiltro('')
              setCombustiveis([]); setCombSel(null)
              if (e.target.value) setTimeout(() => filtroRef.current?.focus(), 50)
            }} className={sel}>
            <option value="">Selecione o ano...</option>
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Modelo — só aparece após ano selecionado e carregamento suficiente */}
      {anoSel && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Modelo
            {!loadingAnos && (
              <span className="text-slate-400 font-normal ml-1">
                ({modelosFiltradosAno.length} disponíveis em {anoSel})
              </span>
            )}
            {loadingAnos && (
              <span className="text-indigo-400 font-normal ml-1">verificando...</span>
            )}
          </label>

          {modelo ? (
            <div className="flex items-center justify-between bg-white rounded-xl border border-indigo-300 px-3 py-2.5">
              <span className="text-sm font-semibold text-indigo-700 truncate">{modelo.nome}</span>
              <button type="button" onClick={resetModelo}
                className="ml-2 text-slate-400 hover:text-slate-600 shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={filtroRef}
                type="text"
                placeholder={
                  loadingAnos && totalCarregado < 10
                    ? 'Aguarde, verificando modelos...'
                    : `Filtrar entre ${modelosFiltradosAno.length} modelos...`
                }
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                disabled={totalCarregado === 0}
                className={inp}
              />
              {filtro.length > 0 && (
                modelosVisiveis.length > 0 ? (
                  <div className="mt-1 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-50">
                    {modelosVisiveis.slice(0, 40).map(m => (
                      <button key={m.codigo} type="button"
                        onMouseDown={e => { e.preventDefault(); setModelo(m); setFiltro(m.nome) }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition-colors">
                        {m.nome}
                      </button>
                    ))}
                    {modelosVisiveis.length > 40 && (
                      <p className="text-center text-xs text-slate-400 py-2">
                        +{modelosVisiveis.length - 40} resultados — refine a busca
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1 px-1">
                    {loadingAnos ? 'Ainda verificando...' : `Nenhum modelo encontrado para "${filtro}" em ${anoSel}.`}
                  </p>
                )
              )}
            </>
          )}
        </div>
      )}

      {/* Combustível — só aparece quando há mais de uma opção */}
      {combustiveis.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Combustível</label>
          <select value={combSel?.codigo || ''}
            onChange={e => {
              const c = combustiveis.find(c => c.codigo === e.target.value)
              setCombSel(c || null)
            }} className={sel}>
            <option value="">Selecione o combustível...</option>
            {combustiveis.map(c => (
              <option key={c.codigo} value={c.codigo}>
                {c.nome.split(' ').slice(1).join(' ')}
              </option>
            ))}
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
        <button type="button" onClick={confirmar}
          disabled={!marca || !modelo || (!combSel && combustiveis.length !== 1)}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
          Confirmar
        </button>
      </div>
    </div>
  )
}
