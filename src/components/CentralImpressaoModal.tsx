import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Printer,
  CheckSquare,
  Square,
  Calendar,
  Layers,
  FileText,
  Clock,
  Car,
  UserCheck,
  Building2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import BrasaoPCPB from '@/components/BrasaoPCPB'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  escalasService,
  servidoresService,
  feriadosService,
  atribuicoesService,
  custodiasService,
  permanenciasService,
  unidadesService,
} from '@/services/policeServices'
import type {
  Escala,
  Servidor,
  Feriado,
  TipoDiaEscala,
  Custodia,
  Permanencia,
  Unidade,
} from '@/types/police'
import { getUnidadeEscrivaes, getUnidadeAgentes } from '@/types/police'
import { calcularHorariosAgentes, formatarDataBr, formatarTelefone } from '@/lib/escalaRules'
import { calcularRelatorioHoras } from '@/components/RelatorioHoras'

export interface CentralImpressaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TipoEscalaSelecionavel =
  | 'plantao_atribuicoes'
  | 'permanencia'
  | 'delegados'
  | 'custodias'
  | 'lotacao'
  | 'horas'

export default function CentralImpressaoModal({ open, onOpenChange }: CentralImpressaoModalProps) {
  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())
  const [orientacao, setOrientacao] = useState<'landscape' | 'portrait'>('landscape')

  // Seleção de escalas
  const [selecionadas, setSelecionadas] = useState<Record<TipoEscalaSelecionavel, boolean>>({
    plantao_atribuicoes: true,
    permanencia: true,
    delegados: true,
    custodias: true,
    lotacao: true,
    horas: true,
  })

  // Dados carregados para o mês/ano
  const [loading, setLoading] = useState(false)
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [atribuicoesTexto, setAtribuicoesTexto] = useState<string>('')
  const [custodias, setCustodias] = useState<Custodia[]>([])
  const [permanencias, setPermanencias] = useState<Permanencia[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])

  const carregarDadosCompletos = useCallback(async () => {
    try {
      setLoading(true)
      const [esc, srv, feri, atrib, cust, perm, unid] = await Promise.all([
        escalasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
        feriadosService.getAll(),
        atribuicoesService.getByMesAno(mes, ano),
        custodiasService.getByMesAno(mes, ano),
        permanenciasService.getByMesAno(mes, ano),
        unidadesService.getAll(),
      ])

      setEscalas(esc)
      setServidores(srv)
      setFeriados(feri)
      setCustodias(cust)
      setPermanencias(perm)
      setUnidades(unid)

      if (atrib?.conteudo) {
        setAtribuicoesTexto(atrib.conteudo)
      } else {
        setAtribuicoesTexto(`<h3>ATRIBUIÇÕES DOS PLANTONISTAS</h3>
<p>Os servidores escalados para o regime de plantão policial deverão cumprir com presteza as atribuições inerentes a cada função:</p>
<ul>
  <li><strong>Delegado de Polícia:</strong> Coordenação da unidade, deliberação sobre flagrantes, concessão de fiança legal e medidas urgentes.</li>
  <li><strong>Escrivão de Polícia:</strong> Formalização de autos de prisão, termos circunstanciados e expedição de guias periciais.</li>
  <li><strong>Agentes / Investigadores:</strong> Diligências preliminares imediatas, atendimento, custódia provisória e segurança da equipe.</li>
</ul>`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados consolidados para impressão.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    if (open) {
      carregarDadosCompletos()
    }
  }, [open, carregarDadosCompletos])

  const toggleOpcao = (tipo: TipoEscalaSelecionavel) => {
    setSelecionadas((prev) => ({ ...prev, [tipo]: !prev[tipo] }))
  }

  const handleSelecionarTodas = () => {
    setSelecionadas({
      plantao_atribuicoes: true,
      permanencia: true,
      delegados: true,
      custodias: true,
      lotacao: true,
      horas: true,
    })
  }

  const handleDesmarcarTodas = () => {
    setSelecionadas({
      plantao_atribuicoes: false,
      permanencia: false,
      delegados: false,
      custodias: false,
      lotacao: false,
      horas: false,
    })
  }

  const totalSelecionadas = Object.values(selecionadas).filter(Boolean).length

  // Helper Feriado
  const getFeriadoDoDia = useCallback(
    (dia: number): Feriado | null => {
      for (const f of feriados) {
        const fDate = new Date(f.data)
        const fDia = fDate.getUTCDate()
        const fMes = fDate.getUTCMonth() + 1
        const fAno = fDate.getUTCFullYear()
        if (f.recorrente) {
          if (fDia === dia && fMes === mes) return f
        } else {
          if (fDia === dia && fMes === mes && fAno === ano) return f
        }
      }
      return null
    },
    [feriados, mes, ano],
  )

  // Helper Tipo Dia
  const getTipoDia = useCallback(
    (dia: number): TipoDiaEscala => {
      const feriado = getFeriadoDoDia(dia)
      if (feriado) return 'Feriado'
      const date = new Date(ano, mes - 1, dia)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0) return 'Domingo'
      if (dayOfWeek === 6) return 'Sábado'
      if (dayOfWeek === 5) return 'Sexta-Feira'
      return 'Dia Útil'
    },
    [ano, mes, getFeriadoDoDia],
  )

  const diasNoMes = useMemo(() => new Date(ano, mes, 0).getDate(), [ano, mes])

  const getNomeServidor = (id?: string | null): string => {
    if (!id) return '-'
    return servidores.find((s) => s.id === id)?.nome || '-'
  }

  const getServidor = (id?: string | null): Servidor | undefined => {
    if (!id) return undefined
    return servidores.find((s) => s.id === id)
  }

  // Dados calculados para Horas
  const dadosHoras = useMemo(() => {
    return calcularRelatorioHoras(mes, ano, escalas, servidores, feriados)
  }, [mes, ano, escalas, servidores, feriados])

  // Grade consolidada de Plantão
  const gradePlantao = useMemo(() => {
    const list = []
    const escMap = new Map<number, Escala>()
    for (const e of escalas) escMap.set(e.dia, e)
    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        escala: escMap.get(d),
      })
    }
    return list
  }, [ano, mes, diasNoMes, getTipoDia, getFeriadoDoDia, escalas])

  // Grade consolidada de Custódias
  const gradeCustodias = useMemo(() => {
    const list = []
    const custMap = new Map<number, Custodia>()
    for (const c of custodias) custMap.set(c.dia, c)
    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const bloqueado = tipoDia === 'Sábado' || tipoDia === 'Domingo' || tipoDia === 'Feriado'
      const c = custMap.get(d)
      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        bloqueado,
        custodia: c,
        ag1Nome: c?.agente1 ? getNomeServidor(c.agente1) : '-',
        ag2Nome: c?.agente2 ? getNomeServidor(c.agente2) : '-',
        ag3Nome: c?.agente3 ? getNomeServidor(c.agente3) : null,
      })
    }
    return list
  }, [ano, mes, diasNoMes, custodias, getTipoDia, getFeriadoDoDia, servidores])

  // Grupos Permanência por dia da semana
  const gruposPermanencia = useMemo(() => {
    const grupos = [
      { diaSemanaIndice: 1, nomeSingular: 'Segunda-feira', dias: [] as number[] },
      { diaSemanaIndice: 2, nomeSingular: 'Terça-feira', dias: [] as number[] },
      { diaSemanaIndice: 3, nomeSingular: 'Quarta-feira', dias: [] as number[] },
      { diaSemanaIndice: 4, nomeSingular: 'Quinta-feira', dias: [] as number[] },
      { diaSemanaIndice: 5, nomeSingular: 'Sexta-feira', dias: [] as number[] },
    ]
    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const dayOfWeek = dataObj.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const g = grupos.find((item) => item.diaSemanaIndice === dayOfWeek)
        if (g) g.dias.push(d)
      }
    }
    const permMap = new Map<number, Permanencia>()
    for (const p of permanencias) permMap.set(p.dia, p)

    return grupos.map((g) => ({
      ...g,
      itens: g.dias.map((d) => ({
        dia: d,
        permanencia: permMap.get(d),
      })),
    }))
  }, [ano, mes, diasNoMes, permanencias])

  // Grade Delegados
  const gradeDelegados = useMemo(() => {
    const list = []
    const escMap = new Map<number, Escala>()
    for (const e of escalas) escMap.set(e.dia, e)
    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const esc = escMap.get(d)
      const del = esc?.delegado ? getServidor(esc.delegado) : null

      const diaSemanaTexto = dataObj
        .toLocaleDateString('pt-BR', { weekday: 'long' })
        .toUpperCase()
        .replace('-FEIRA', '')
        .trim()
      const is24h = tipoDia === 'Sábado' || tipoDia === 'Domingo' || tipoDia === 'Feriado'
      const regime = is24h ? '24hs' : '14hs'

      list.push({
        dia: d,
        diaSemanaRegime: `${diaSemanaTexto} - ${regime}`,
        isDiferenciado: is24h,
        delegado: del,
      })
    }
    return list
  }, [ano, mes, diasNoMes, escalas, servidores, getTipoDia, getFeriadoDoDia])

  const mesesNomes = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const handleExecutarImpressao = () => {
    if (totalSelecionadas === 0) {
      toast.warning('Selecione pelo menos uma escala para imprimir.')
      return
    }

    // Fecha o modal antes para desmontar o Dialog e Backdrop do Radix
    onOpenChange(false)

    // Dispara window.print() após desmontagem completa do Dialog e Backdrop
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print()
      }, 250)
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#0B2545]" />
              Central Unificada de Impressão Multiescalas
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Selecione as escalas que deseja compilar em um único documento PDF institucional, com
              quebra de página automática entre cada seção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Controles de Mês e Ano */}
            <div className="flex flex-wrap items-center gap-3 bg-[#F5F7FA] p-3 rounded-lg border border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-[#1F2937]">Mês de Referência:</Label>
                <Select value={String(mes)} onValueChange={(val) => setMes(parseInt(val, 10))}>
                  <SelectTrigger className="w-[140px] h-8 border-[#D1D5DB] text-xs font-medium text-[#0B2545]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesNomes.map((nome, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-[#1F2937]">Ano:</Label>
                <Select value={String(ano)} onValueChange={(val) => setAno(parseInt(val, 10))}>
                  <SelectTrigger className="w-[90px] h-8 border-[#D1D5DB] text-xs font-medium text-[#0B2545]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027, 2028].map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de Orientação da Página */}
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-[#1F2937]">Orientação Geral:</Label>
                <Select
                  value={orientacao}
                  onValueChange={(val: 'landscape' | 'portrait') => setOrientacao(val)}
                >
                  <SelectTrigger className="w-[140px] h-8 border-[#D1D5DB] text-xs font-medium text-[#0B2545]">
                    <SelectValue placeholder="Orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Paisagem (A4)</SelectItem>
                    <SelectItem value="portrait">Retrato (A4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Carregando dados...
                </div>
              )}
            </div>

            {/* Ações rápidas de seleção */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-xs text-[#0B2545]">
                Escalas para Compilação ({totalSelecionadas} selecionadas):
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelecionarTodas}
                  className="h-7 text-[11px] text-[#0B2545] hover:bg-[#F5F7FA]"
                >
                  Selecionar Todas
                </Button>
                <span className="text-gray-300">|</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDesmarcarTodas}
                  className="h-7 text-[11px] text-gray-500 hover:bg-[#F5F7FA]"
                >
                  Desmarcar Todas
                </Button>
              </div>
            </div>

            {/* Lista de Checkboxes das 6 Escalas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Plantão Geral */}
              <label
                onClick={() => toggleOpcao('plantao_atribuicoes')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.plantao_atribuicoes
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.plantao_atribuicoes ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">1. Escala Geral de Plantão</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Grade mensal completa + Atribuições oficiais dos plantonistas
                  </p>
                </div>
              </label>

              {/* 2. Permanência */}
              <label
                onClick={() => toggleOpcao('permanencia')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.permanencia
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.permanencia ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">2. Escala de Permanência</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Atendimento em dias úteis (Segunda a Sexta com duplas)
                  </p>
                </div>
              </label>

              {/* 3. Delegados */}
              <label
                onClick={() => toggleOpcao('delegados')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.delegados
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.delegados ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">3. Escala de Delegados</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Mural com regimes de 14h/24h e telefones operacionais
                  </p>
                </div>
              </label>

              {/* 4. Custódias */}
              <label
                onClick={() => toggleOpcao('custodias')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.custodias
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.custodias ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">4. Escala de Custódias</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Viatura fixa S10 com xadrez e agentes designados
                  </p>
                </div>
              </label>

              {/* 5. Lotação / Expediente */}
              <label
                onClick={() => toggleOpcao('lotacao')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.lotacao
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.lotacao ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">
                    5. Expediente / Lotação das Unidades
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Quadro consolidado de delegacias e efetivos vinculados
                  </p>
                </div>
              </label>

              {/* 6. Relatório de Horas */}
              <label
                onClick={() => toggleOpcao('horas')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selecionadas.horas
                    ? 'bg-blue-50/50 border-[#0B2545] text-[#0B2545]'
                    : 'bg-white border-[#E5E9F0] text-gray-700 hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  {selecionadas.horas ? (
                    <CheckSquare className="w-4 h-4 text-[#0B2545]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight">
                    6. Relatório de Carga Horária
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Demonstrativo: Horas Normais (14h) vs. Majoradas (14h/24h)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E5E9F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 border-[#D1D5DB]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleExecutarImpressao}
              disabled={loading || totalSelecionadas === 0}
              className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 shadow-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Imprimir Selecionadas ({totalSelecionadas})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ÁREA DE IMPRESSÃO COMPILADA EM LOTE (Visível apenas na janela de impressão do navegador) */}
      <div className="hidden print:block print:p-0 print:border-none print:shadow-none bg-white text-black">
        {/* Injeção dinâmica da orientação escolhida para o spool de impressão */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@media print { @page { size: A4 ${orientacao}; margin: 8mm; } }`,
          }}
        />

        {/* ========================================================================= */}
        {/* 1. ESCALA GERAL DE PLANTÃO + ATRIBUIÇÕES */}
        {/* ========================================================================= */}
        {selecionadas.plantao_atribuicoes && (
          <div className="page-break-after-always print-landscape print-section w-full max-w-full box-border">
            {/* Cabeçalho */}
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    ESCALA GERAL DE PLANTÃO POLICIAL OPERACIONAL —{' '}
                    {mesesNomes[mes - 1].toUpperCase()} DE {ano}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 1/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Tabela */}
            <table className="w-full border-collapse text-[9px] border border-[#0B2545] table-auto">
              <thead>
                <tr className="bg-[#0B2545] text-white font-semibold">
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-10">DATA</th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-12">DIA</th>
                  <th className="py-1 px-1.5 border border-[#0B2545] w-20">TIPO</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">DELEGADO(A)</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">ESCRIVÃO(Ã)</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">AGENTE 1</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">AGENTE 2</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">AGENTE 3</th>
                  <th className="py-1 px-1.5 border border-[#0B2545]">HORÁRIOS</th>
                </tr>
              </thead>
              <tbody>
                {gradePlantao.map((item, idx) => {
                  const d = item.dia
                  const diaSemana = item.dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })
                  const esc = item.escala
                  const temAgente3 = !!esc?.agente3
                  const horarios = calcularHorariosAgentes(item.tipoDia, temAgente3)
                  return (
                    <tr
                      key={d}
                      className={`border-b border-gray-300 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <td className="py-0.5 px-1 text-center font-bold border-r border-gray-300">
                        {String(d).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                      </td>
                      <td className="py-0.5 px-1 text-center uppercase border-r border-gray-300 font-semibold text-[8px]">
                        {diaSemana}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300 text-[8.5px]">
                        {item.tipoDia}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300 font-medium">
                        {getNomeServidor(esc?.delegado)}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300">
                        {getNomeServidor(esc?.escrivao)}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300">
                        {getNomeServidor(esc?.agente1)}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300">
                        {getNomeServidor(esc?.agente2)}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-gray-300">
                        {esc?.agente3 ? getNomeServidor(esc.agente3) : '-'}
                      </td>
                      <td className="py-0.5 px-1 text-[8px] font-mono leading-tight">
                        {horarios.plantaoDesc} (1: {horarios.agente1} | 2: {horarios.agente2}
                        {horarios.agente3 && ` | 3: ${horarios.agente3}`})
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Atribuições anexas */}
            <div className="mt-4 pt-3 border-t border-gray-300 break-inside-avoid text-[10px]">
              <h3 className="font-bold text-[#0B2545] uppercase tracking-wider mb-1">
                ATRIBUIÇÕES DOS PLANTONISTAS
              </h3>
              <div
                className="leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: atribuicoesTexto }}
              />

              <div className="mt-6 pt-4 border-t border-gray-400 grid grid-cols-2 gap-8 text-center text-[10px]">
                <div>
                  <div className="border-t border-black pt-1 w-3/4 mx-auto font-semibold">
                    Dr. Antonio Luiz Barbosa Netto
                  </div>
                  <p className="text-gray-600">Delegado Seccional 20ª DSPC</p>
                </div>
                <div>
                  <div className="border-t border-black pt-1 w-3/4 mx-auto font-semibold">
                    Coordenação de Escalas e Operações
                  </div>
                  <p className="text-gray-600">20ª DSPC / PCPB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ESCALA DE PERMANÊNCIA (DIAS ÚTEIS) */}
        {/* ========================================================================= */}
        {selecionadas.permanencia && (
          <div className="page-break-after-always print-portrait print-section w-full max-w-full box-border">
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    ESCALA DE PERMANÊNCIA (DIAS ÚTEIS DE EXPEDIENTE) —{' '}
                    {mesesNomes[mes - 1].toUpperCase()}/{ano}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 2/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-[11px] border border-[#0B2545]">
              <thead>
                <tr className="bg-[#0B2545] text-white">
                  <th className="py-2 px-2.5 border border-[#0B2545] text-center w-16">DATA</th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left w-32">
                    DIA DA SEMANA
                  </th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left">
                    1º SERVIDOR PERMANENTE
                  </th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left">
                    2º SERVIDOR PERMANENTE
                  </th>
                </tr>
              </thead>
              <tbody>
                {gruposPermanencia.flatMap((g) =>
                  g.itens.map((item, idx) => (
                    <tr
                      key={item.dia}
                      className={`border-b border-gray-300 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <td className="py-1.5 px-2.5 text-center font-bold text-[#0B2545] border-r border-gray-300">
                        {String(item.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold border-r border-gray-300">
                        {g.nomeSingular}
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-gray-300">
                        {getNomeServidor(item.permanencia?.agente1)}
                      </td>
                      <td className="py-1.5 px-2.5">
                        {getNomeServidor(item.permanencia?.agente2)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>

            <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px] break-inside-avoid">
              <div>
                <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
                <p className="text-gray-500">Escala de Permanência Homologada</p>
              </div>
              <div className="text-center">
                <div className="w-52 border-b border-black mb-1" />
                <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
                <p className="text-gray-500">20ª DSPC</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ESCALA DE DELEGADOS (MURAL COM TELEFONES) */}
        {/* ========================================================================= */}
        {selecionadas.delegados && (
          <div className="page-break-after-always print-portrait print-section w-full max-w-full box-border">
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    ESCALA DE PLANTÃO DE DELEGADOS DE POLÍCIA — {mesesNomes[mes - 1].toUpperCase()}/
                    {ano}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 3/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-xs border border-[#0B2545]">
              <thead>
                <tr className="bg-[#0B2545] text-white font-semibold">
                  <th className="py-2 px-2.5 border border-[#0B2545] text-center w-16">DIA</th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left w-44">
                    DIA DA SEMANA E REGIME
                  </th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left">DELEGADO(A)</th>
                  <th className="py-2 px-2.5 border border-[#0B2545] text-left w-48">
                    TELEFONE OPERACIONAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {gradeDelegados.map((item, idx) => {
                  const del = item.delegado
                  return (
                    <tr
                      key={item.dia}
                      className={`border-b border-gray-300 ${
                        item.isDiferenciado
                          ? 'bg-amber-50/40 font-medium'
                          : idx % 2 === 1
                            ? 'bg-gray-50'
                            : 'bg-white'
                      }`}
                    >
                      <td className="py-1.5 px-2.5 text-center font-bold text-sm text-[#0B2545] border-r border-gray-300">
                        {String(item.dia).padStart(2, '0')}
                      </td>
                      <td className="py-1.5 px-2.5 font-bold uppercase border-r border-gray-300">
                        {item.diaSemanaRegime}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-[#0B2545] border-r border-gray-300">
                        {del?.nome || '-'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-xs text-gray-800">
                        {del?.telefone ? formatarTelefone(del.telefone) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px] break-inside-avoid">
              <div>
                <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
                <p className="text-gray-500">Mural Operacional de Delegados</p>
              </div>
              <div className="text-center">
                <div className="w-52 border-b border-black mb-1" />
                <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
                <p className="text-gray-500">20ª DSPC</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ESCALA DE CUSTÓDIAS */}
        {/* ========================================================================= */}
        {selecionadas.custodias && (
          <div className="page-break-after-always print-portrait print-section w-full max-w-full box-border">
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    ESCALA DE CUSTÓDIAS E TRANSPORTE DE PRESOS — {mesesNomes[mes - 1].toUpperCase()}
                    /{ano}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 4/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-[10px] border border-[#0B2545]">
              <thead>
                <tr className="bg-[#0B2545] text-white">
                  <th className="py-2 px-2 border border-[#0B2545] text-center w-14">DATA</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left w-24">DIA</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left w-36">VIATURA</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left">AGENTE 1</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left">AGENTE 2</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left">AGENTE 3</th>
                </tr>
              </thead>
              <tbody>
                {gradeCustodias.map((item, idx) => (
                  <tr
                    key={item.dia}
                    className={`border-b border-gray-300 ${
                      item.bloqueado ? 'bg-amber-50/30' : idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center font-bold text-[#0B2545] border-r border-gray-300">
                      {String(item.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 uppercase font-medium border-r border-gray-300">
                      {item.dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-[#0B2545] border-r border-gray-300">
                      S10 COM XADREZ
                    </td>
                    {item.bloqueado ? (
                      <td
                        colSpan={3}
                        className="py-1.5 px-2 text-center font-bold text-amber-900 bg-amber-50/50"
                      >
                        (PLANTONISTA)
                      </td>
                    ) : (
                      <>
                        <td className="py-1.5 px-2 border-r border-gray-300">{item.ag1Nome}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300">{item.ag2Nome}</td>
                        <td className="py-1.5 px-2">{item.ag3Nome || '-'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px] break-inside-avoid">
              <div>
                <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
                <p className="text-gray-500">Escala de Custódias Homologada</p>
              </div>
              <div className="text-center">
                <div className="w-52 border-b border-black mb-1" />
                <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
                <p className="text-gray-500">20ª DSPC</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. QUADRO DE EXPEDIENTE / LOTAÇÃO DAS UNIDADES */}
        {/* ========================================================================= */}
        {selecionadas.lotacao && (
          <div className="page-break-after-always print-portrait print-section w-full max-w-full box-border">
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    QUADRO GERAL DE LOTAÇÃO E EXPEDIENTE DAS UNIDADES POLICIAIS
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 5/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-[10px] border border-[#0B2545]">
              <thead>
                <tr className="bg-[#0B2545] text-white">
                  <th className="py-2 px-2 border border-[#0B2545] text-left w-36">
                    DELEGACIA / UNIDADE
                  </th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left w-44">
                    DELEGADO(A) TITULAR
                  </th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left w-40">ESCRIVÃES</th>
                  <th className="py-2 px-2 border border-[#0B2545] text-left">
                    AGENTES / INVESTIGADORES (ATÉ 20)
                  </th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => {
                  const escList = getUnidadeEscrivaes(u)
                  const agList = getUnidadeAgentes(u)
                  return (
                    <tr key={u.id} className="border-b border-gray-300">
                      <td className="py-2 px-2 font-bold text-[#0B2545] border-r border-gray-300 align-top">
                        {u.nome}
                      </td>
                      <td className="py-2 px-2 font-semibold text-gray-900 border-r border-gray-300 align-top">
                        {getNomeServidor(u.delegado)}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-300 align-top">
                        {escList.length === 0 ? (
                          <span className="text-gray-400 italic">-</span>
                        ) : (
                          <div className="space-y-0.5">
                            {escList.map((id) => (
                              <div key={id}>• {getNomeServidor(id)}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 align-top">
                        {agList.length === 0 ? (
                          <span className="text-gray-400 italic">-</span>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            {agList.map((id) => (
                              <span key={id}>• {getNomeServidor(id)}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px] break-inside-avoid">
              <div>
                <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
                <p className="text-gray-500">Expediente Oficial das Unidades</p>
              </div>
              <div className="text-center">
                <div className="w-52 border-b border-black mb-1" />
                <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
                <p className="text-gray-500">20ª DSPC</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. RELATÓRIO DE HORAS: NORMAIS VS. MAJORADAS */}
        {/* ========================================================================= */}
        {selecionadas.horas && (
          <div className="print-portrait print-section w-full max-w-full box-border">
            <div className="border-b-2 border-[#0B2545] pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <BrasaoPCPB className="h-14 w-auto max-w-[56px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                    POLÍCIA CIVIL DO ESTADO DA PARAÍBA
                  </p>
                  <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide">
                    20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                  </h2>
                  <p className="text-xs font-semibold text-[#1F2937]">
                    RELATÓRIO GERENCIAL DE CARGA HORÁRIA — {mesesNomes[mes - 1].toUpperCase()}/{ano}
                  </p>
                  <p className="text-[9px] text-[#6B7280]">
                    Horas Normais (Seg a Qui - 14h) | Horas Majoradas (Sex 14h, FDS e Feriados 24h)
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]">
                <p className="font-semibold text-[#0B2545]">Documento Oficial 6/6</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Resumo de Métricas na Impressão */}
            <div className="grid grid-cols-4 gap-2 mb-3 text-center text-[10px] border border-gray-300 p-2 rounded">
              <div>
                <p className="text-gray-500 uppercase text-[9px]">Total Normais</p>
                <p className="font-bold text-sm text-[#0B2545]">{dadosHoras.totalGeralNormais}h</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-[9px]">Total Majoradas</p>
                <p className="font-bold text-sm text-amber-700">
                  {dadosHoras.totalGeralMajoradas}h
                </p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-[9px]">Carga Total Geral</p>
                <p className="font-bold text-sm text-black">{dadosHoras.totalGeralHoras}h</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-[9px]">Médias por Cargo</p>
                <p className="font-semibold text-[10px] text-gray-800">
                  Del: {dadosHoras.mediaDelegados}h | Esc: {dadosHoras.mediaEscrivaes}h | Ag:{' '}
                  {dadosHoras.mediaAgentes}h
                </p>
              </div>
            </div>

            <table className="w-full border-collapse text-[9px] border border-[#0B2545] table-auto">
              <thead>
                <tr className="bg-[#0B2545] text-white">
                  <th className="py-1 px-1.5 border border-[#0B2545] text-left">
                    SERVIDOR POLICIAL
                  </th>
                  <th className="py-1 px-1.5 border border-[#0B2545] text-left w-24">CARGO</th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-16">
                    PLANT. NORM.
                  </th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-16">H. NORM.</th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-16">
                    PLANT. MAJ.
                  </th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-16">H. MAJ.</th>
                  <th className="py-1 px-1 border border-[#0B2545] text-center w-16">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {dadosHoras.itens.map((it, idx) => (
                  <tr
                    key={it.servidor.id}
                    className={`border-b border-gray-300 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="py-0.5 px-1.5 font-medium border-r border-gray-300">
                      {it.servidor.nome}
                    </td>
                    <td className="py-0.5 px-1.5 border-r border-gray-300 text-[8.5px]">
                      {it.cargo}
                    </td>
                    <td className="py-0.5 px-1 text-center border-r border-gray-300">
                      {it.plantoesNormais}
                    </td>
                    <td className="py-0.5 px-1 text-center font-semibold border-r border-gray-300">
                      {it.horasNormais}h
                    </td>
                    <td className="py-0.5 px-1 text-center border-r border-gray-300">
                      {it.plantoesMajorados}
                    </td>
                    <td className="py-0.5 px-1 text-center font-semibold text-amber-800 border-r border-gray-300">
                      {it.horasMajoradas}h
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0B2545]">
                      {it.totalHoras}h
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold border-t-2 border-black">
                  <td colSpan={2} className="py-1 px-1.5 uppercase">
                    TOTAL GERAL
                  </td>
                  <td className="py-1 px-1 text-center">
                    {dadosHoras.itens.reduce((acc, c) => acc + c.plantoesNormais, 0)}
                  </td>
                  <td className="py-1 px-1 text-center">{dadosHoras.totalGeralNormais}h</td>
                  <td className="py-1 px-1 text-center">
                    {dadosHoras.itens.reduce((acc, c) => acc + c.plantoesMajorados, 0)}
                  </td>
                  <td className="py-1 px-1 text-center text-amber-900">
                    {dadosHoras.totalGeralMajoradas}h
                  </td>
                  <td className="py-1 px-1 text-center text-black">
                    {dadosHoras.totalGeralHoras}h
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px] break-inside-avoid">
              <div>
                <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
                <p className="text-gray-500">Demonstrativo de Carga Horária Homologado</p>
              </div>
              <div className="text-center">
                <div className="w-52 border-b border-black mb-1" />
                <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
                <p className="text-gray-500">20ª DSPC</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
