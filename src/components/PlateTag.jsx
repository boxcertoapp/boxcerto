// ── Placa de veículo realista ───────────────────────────────
// Detecta o formato e renderiza (ambas no MESMO tamanho):
//  • Mercosul (ABC1D23) → faixa azul "BR · BRASIL" + número
//  • Antiga   (ABC-1234) → faixa cinza "BRASIL" + número
// Fallback: Mercosul (padrão atual de emplacamento).

function limpar(placa) {
  return (placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function tipoPlaca(placa) {
  const c = limpar(placa)
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(c)) return 'mercosul'
  if (/^[A-Z]{3}[0-9]{4}$/.test(c)) return 'antiga'
  return 'mercosul'
}

function fmtAntiga(placa) {
  const c = limpar(placa)
  return c.length === 7 ? `${c.slice(0, 3)}-${c.slice(3)}` : (placa || '')
}

export default function PlateTag({ placa, sm = false }) {
  const tipo   = tipoPlaca(placa)
  const numero = tipo === 'antiga' ? fmtAntiga(placa) : limpar(placa)

  // Tipografia igual à de antes (fonte de placa, bold, espaçada)
  const numCls = `plate-mercosul font-bold tracking-widest text-slate-900 ${sm ? 'text-[11px]' : 'text-sm'}`
  // Wrapper comum → garante o MESMO tamanho nas duas
  const wrap   = `inline-flex flex-col shrink-0 overflow-hidden rounded-md border bg-white shadow-sm ${sm ? 'min-w-[58px]' : 'min-w-[72px]'}`
  const bandH  = sm ? 'h-[8px]' : 'h-[10px]'
  const numPad = sm ? 'px-1.5 pb-[3px] pt-px' : 'px-2 pb-1 pt-0.5'
  const labelFs = sm ? 4.5 : 5.5

  if (tipo === 'antiga') {
    return (
      <div className={`${wrap} border-slate-400/80`} style={{ background: 'linear-gradient(#e5e7eb,#cbd5e1)' }}>
        <div className={`flex items-center justify-center bg-slate-500 ${bandH}`}>
          <span className="font-semibold leading-none text-white" style={{ fontSize: labelFs, letterSpacing: '.08em' }}>BRASIL</span>
        </div>
        <div className={`text-center ${numPad}`}>
          <span className={numCls}>{numero}</span>
        </div>
      </div>
    )
  }

  // Mercosul
  return (
    <div className={`${wrap} border-slate-300`}>
      <div className={`flex items-center justify-between bg-[#1e3a8a] px-1 ${bandH}`}>
        <span className="font-bold leading-none text-white" style={{ fontSize: labelFs, letterSpacing: '.04em' }}>BR</span>
        <span className="font-semibold leading-none text-white" style={{ fontSize: labelFs, letterSpacing: '.06em' }}>BRASIL</span>
      </div>
      <div className={`text-center ${numPad}`}>
        <span className={numCls}>{numero}</span>
      </div>
    </div>
  )
}
