import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Car,
  Printer,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit2,
  Users,
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
  custodiasService,
  servidoresService,
  feriadosService,
  escalasService,
} from '@/services/policeServices'
import type { Custodia, Servidor, Feriado, TipoDiaEscala, Escala } from '@/types/police'
import ServidorAutocomplete from '@/components/ServidorAutocomplete'
import ConfirmacaoOperacionalModal from '@/components/ConfirmacaoOperacionalModal'
import useRealtime from '@/hooks/use-realtime'

export default function EscalaCustodias() {
  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [custodias, setCustodias] = useState<Custodia[]>([])
  const [escalasMensais, setEscalasMensais] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de Edição de Custódia para dia útil
  const [editingDia, setEditingDia] = useState<number | null>(null)
  const [formAgente1, setFormAgente1] = useState<string>('')
  const [formAgente2, setFormAgente2] = useState<string>('')
  const [formAgente3, setFormAgente3] = useState<string>('')
  const [salvandoDia, setSalvandoDia] = useState(false)

  // Modal de confirmação inteligente para sobreposição de plantão no mesmo dia
  const [modalConfirmacaoOpen, setModalConfirmacaoOpen] = useState(false)
  const [consequenciaConfirmacao, setConsequenciaConfirmacao] = useState('')
  const [acaoAposConfirmacao, setAcaoAposConfirmacao] = useState<(() => Promise<void>) | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [cust, srv, feri, esc] = await Promise.all([
        custodiasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
        feriadosService.getAll(),
        escalasService.getByMesAno(mes, ano),
      ])
      setCustodias(cust)
      setServidores(srv)
      setFeriados(feri)
      setEscalasMensais(esc)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar escala de custódia.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('custodias', () => carregarDados())

  // Filtra somente agentes/investigadores ativos para a custódia
  const agentes = useMemo(
    () => servidores.filter((s) => s.cargo === 'Agente/Investigador' && s.status === 'Ativo'),
    [servidores],
  )

  const diasNoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate()
  }, [ano, mes])

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

  // Regra de bloqueio da custódia:
  // Sábados, Domingos e Feriados: campo de agentes preenchido automaticamente com "(PLANTONISTA)" e BLOQUEADO para edição.
  const isDiaBloqueado = useCallback((tipoDia: TipoDiaEscala) => {
    return tipoDia === 'Sábado' || tipoDia === 'Domingo' || tipoDia === 'Feriado'
  }, [])

  // Grade consolidada de Custódias
  const gradeCustodias = useMemo(() => {
    const list = []
    const custodiasMap = new Map<number, Custodia>()
    for (const c of custodias) {
      custodiasMap.set(c.dia, c)
    }

    const servidoresMap = new Map<string, Servidor>()
    for (const s of servidores) {
      servidoresMap.set(s.id, s)
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const custodia = custodiasMap.get(d)
      const bloqueado = isDiaBloqueado(tipoDia)

      const ag1 = custodia?.agente1 ? servidoresMap.get(custodia.agente1) || null : null
      const ag2 = custodia?.agente2 ? servidoresMap.get(custodia.agente2) || null : null
      const ag3 = custodia?.agente3 ? servidoresMap.get(custodia.agente3) || null : null

      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        bloqueado,
        custodia,
        viatura: 'S10 COM XADREZ', // VTR SEMPRE fixa e automática
        agente1: ag1,
        agente2: ag2,
        agente3: ag3,
      })
    }

    return list
  }, [ano, mes, diasNoMes, custodias, servidores, getTipoDia, getFeriadoDoDia, isDiaBloqueado])

  const handleOpenEdit = (dia: number) => {
    const item = gradeCustodias.find((g) => g.dia === dia)
    if (!item || item.bloqueado) {
      toast.info('Em sábados, domingos e feriados a custódia é realizada pelo PLANTONISTA.')
      return
    }

    const c = item.custodia
    setEditingDia(dia)
    setFormAgente1(c?.agente1 || '')
    setFormAgente2(c?.agente2 || '')
    setFormAgente3(c?.agente3 || '')
  }

  const executarSalvarCustodia = async () => {
    if (!editingDia) return
    try {
      setSalvandoDia(true)
      await custodiasService.upsertDia({
        mes,
        ano,
        dia: editingDia,
        viatura: 'S10 COM XADREZ',
        agente1: formAgente1,
        agente2: formAgente2,
        agente3: formAgente3 || null,
      })

      toast.success(`Custódia do dia ${String(editingDia).padStart(2, '0')} salva com sucesso!`)
      setEditingDia(null)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar alocação de custódia.')
    } finally {
      setSalvandoDia(false)
    }
  }

  const handleSalvarDia = async () => {
    if (!editingDia) return

    // Validar de 2 a 3 agentes
    if (!formAgente1 || !formAgente2) {
      toast.warning('Selecione pelo menos 2 agentes para a custódia do dia.')
      return
    }

    if (
      formAgente1 === formAgente2 ||
      (formAgente3 && (formAgente3 === formAgente1 || formAgente3 === formAgente2))
    ) {
      toast.error('Os agentes selecionados não podem ser iguais. Escolha servidores diferentes.')
      return
    }

    // Modal de confirmação inteligente: Sobreposição com plantão geral no mesmo dia
    const agentesSelecionados = [formAgente1, formAgente2, formAgente3].filter(Boolean) as string[]
    const escalaDoDia = escalasMensais.find((e) => e.dia === editingDia)
    const plantonistasDoDia = escalaDoDia
      ? [
          escalaDoDia.delegado,
          escalaDoDia.escrivao,
          escalaDoDia.agente1,
          escalaDoDia.agente2,
          escalaDoDia.agente3,
        ].filter(Boolean)
      : []

    const sobrepostos = agentesSelecionados.filter((id) => plantonistasDoDia.includes(id))

    if (sobrepostos.length > 0) {
      const nomes = sobrepostos
        .map((id) => servidores.find((s) => s.id === id)?.nome || 'Servidor')
        .join(', ')
      setConsequenciaConfirmacao(
        `O(s) servidor(es) ${nomes} já consta(m) escalado(s) na Escala Geral de Plantão do dia ${String(editingDia).padStart(2, '0')}/${String(mes).padStart(2, '0')}. Essa inclusão resultará em sobreposição de funções operacionais.`,
      )
      setAcaoAposConfirmacao(() => executarSalvarCustodia)
      setModalConfirmacaoOpen(true)
      return
    }

    await executarSalvarCustodia()
  }

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

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Superior (Não imprime) */}
      <div className="no-print bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Transporte e Prisões • Viatura Operacional
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <Car className="w-6 h-6 text-[#0B2545]" />
            Escala de Custódias
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Alocação de 2 a 3 agentes para custódia em dias úteis com VTR fixa. Finais de semana e
            feriados são assumidos pelo plantonista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-[#1F2937]">Mês:</Label>
            <Select value={String(mes)} onValueChange={(val) => setMes(parseInt(val, 10))}>
              <SelectTrigger className="w-[140px] h-9 border-[#D1D5DB] text-xs font-medium text-[#0B2545]">
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
              <SelectTrigger className="w-[100px] h-9 border-[#D1D5DB] text-xs font-medium text-[#0B2545]">
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

          <Button
            onClick={handlePrint}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white shadow-sm h-9 text-xs flex items-center gap-1.5 font-medium"
          >
            <Printer className="w-4 h-4" />
            Imprimir Custódias
          </Button>

          <Button
            variant="outline"
            onClick={carregarDados}
            className="border-[#D1D5DB] text-[#1F2937] h-9 w-9 p-0"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Box de Regras Operacionais (Não imprime) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-[#0B2545]">Viatura Padronizada (VTR):</p>
            <p className="text-[#6B7280]">
              Campo fixo permanente preenchido automaticamente com <strong>S10 COM XADREZ</strong>{' '}
              para todas as datas.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#C9A227] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-[#0B2545]">Regime de Plantão:</p>
            <p className="text-[#6B7280]">
              Sábados, Domingos e Feriados preenchidos automaticamente com{' '}
              <strong>(PLANTONISTA)</strong> (bloqueado para edição). Dias úteis editáveis (2 a 3
              agentes).
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO E IMPRESSÃO */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] p-6 sm:p-8 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho Institucional */}
        <div className="border-b-2 border-[#0B2545] pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
              <BrasaoPCPB className="h-14 w-auto max-w-[56px] drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                POLÍCIA CIVIL DO ESTADO DA PARAÍBA
              </p>
              <h2 className="text-base sm:text-lg font-bold text-[#0B2545] uppercase tracking-wide leading-tight">
                20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
                ESCALA DE CUSTÓDIA DE PRESOS E TRANSFERÊNCIAS OPERACIONAIS
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Mês de Referência:{' '}
                <strong>
                  {mesesNomes[mes - 1].toUpperCase()} DE {ano}
                </strong>
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#6B7280] hidden sm:block print:block">
            <p className="font-semibold text-[#0B2545]">Viatura Operacional Oficial</p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* TABELA DE CUSTÓDIAS */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs border border-[#0B2545]/30">
            <thead>
              <tr className="bg-[#0B2545] text-white font-semibold text-[11px]">
                <th className="py-2.5 px-3 border border-[#0B2545] text-center w-24">DATA</th>
                <th className="py-2.5 px-3 border border-[#0B2545] text-left w-36">
                  DIA DA SEMANA
                </th>
                <th className="py-2.5 px-3 border border-[#0B2545] text-left w-44">
                  VIATURA (VTR)
                </th>
                <th className="py-2.5 px-3 border border-[#0B2545] text-left">AGENTES ESCALADOS</th>
                <th className="no-print py-2.5 px-3 border border-[#0B2545] text-right w-24">
                  AÇÃO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#6B7280]">
                    Carregando escala de custódias...
                  </td>
                </tr>
              ) : (
                gradeCustodias.map((item, idx) => {
                  const d = item.dia
                  const diaSemana = item.dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })
                  const isFeriado = item.tipoDia === 'Feriado'
                  const isFds = item.tipoDia === 'Sábado' || item.tipoDia === 'Domingo'

                  return (
                    <tr
                      key={d}
                      className={`transition-colors ${
                        item.bloqueado
                          ? 'bg-[#F8FAFC]'
                          : idx % 2 === 1
                            ? 'bg-[#F9FAFB]'
                            : 'bg-white'
                      }`}
                    >
                      {/* Coluna 1: Data */}
                      <td className="py-2.5 px-3 text-center font-bold text-[#0B2545] border-r border-[#E5E9F0]">
                        <span className="text-sm">
                          {String(d).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Coluna 2: Dia da Semana */}
                      <td className="py-2.5 px-3 border-r border-[#E5E9F0]">
                        <span className="font-semibold uppercase text-[#1F2937] text-xs">
                          {diaSemana}
                        </span>
                        {item.feriadoInfo && (
                          <span className="block text-[10px] text-[#C9A227] font-medium truncate max-w-[140px]">
                            ★ {item.feriadoInfo.nome}
                          </span>
                        )}
                      </td>

                      {/* Coluna 3: Viatura (VTR) - SEMPRE FIXO */}
                      <td className="py-2.5 px-3 border-r border-[#E5E9F0]">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-[#0B2545] print:hidden" />
                          <span className="font-mono font-bold text-xs text-[#0B2545] tracking-wide bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.viatura}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 4: Agentes Escalados */}
                      <td className="py-2.5 px-3 border-r border-[#E5E9F0]">
                        {item.bloqueado ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold italic text-xs">
                            <Lock className="w-3.5 h-3.5 text-[#C9A227] print:hidden" />
                            <Badge
                              variant="outline"
                              className="bg-[#FFFDF5] text-[#C9A227] border-[#C9A227] text-xs font-bold"
                            >
                              (PLANTONISTA)
                            </Badge>
                            <span className="text-[11px] text-[#6B7280] hidden sm:inline print:hidden">
                              Equipe de plantão escalada assume a custódia
                            </span>
                          </div>
                        ) : item.custodia && (item.agente1 || item.agente2) ? (
                          <div className="space-y-0.5">
                            <p className="text-[#1F2937]">
                              <strong>1:</strong> {item.agente1?.nome || 'Não definido'}
                            </p>
                            <p className="text-[#1F2937]">
                              <strong>2:</strong> {item.agente2?.nome || 'Não definido'}
                            </p>
                            {item.agente3 && (
                              <p className="text-[#0B2545] font-semibold">
                                <strong>3:</strong> {item.agente3.nome}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6B7280] italic text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 print:hidden" />
                            Pendente de alocação (2 a 3 agentes)
                          </span>
                        )}
                      </td>

                      {/* Coluna 5: Ação (Não imprime) */}
                      <td className="no-print py-2.5 px-3 text-right">
                        {item.bloqueado ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-slate-400 border-slate-200"
                          >
                            Fixo
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(d)}
                            className="h-8 text-xs border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            {item.custodia ? 'Editar' : 'Alocar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Impressão */}
        <div className="mt-6 pt-4 border-t border-[#E5E9F0] text-xs text-[#6B7280] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Viatura oficial exclusiva para custódia e condução: <strong>S10 COM XADREZ</strong>.
          </p>
          <p>Homologado pela Gestão de Escala 20ª DSPC</p>
        </div>
      </div>

      {/* Modal de Alocação de Agentes de Custódia */}
      <Dialog open={editingDia !== null} onOpenChange={(open) => !open && setEditingDia(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <Car className="w-5 h-5 text-[#0B2545]" />
              Alocar Agentes de Custódia — Dia {String(editingDia).padStart(2, '0')}/
              {String(mes).padStart(2, '0')}/{ano}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Selecione obrigatoriamente 02 agentes (e opcionalmente o 3º). Viatura:{' '}
              <strong>S10 COM XADREZ</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Viatura Fixa */}
            <div className="p-3 bg-[#F5F7FA] border border-[#E5E9F0] rounded-lg text-xs">
              <span className="font-semibold text-[#0B2545] block">
                Viatura de Transporte (VTR):
              </span>
              <p className="font-mono font-bold text-sm text-[#0B2545] mt-0.5">S10 COM XADREZ</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Viatura padrão do grupamento de custódia (campo não editável).
              </p>
            </div>

            {/* Agente 1 com Autocomplete Universal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2937]">Agente de Custódia 1 *</Label>
              <ServidorAutocomplete
                servidores={agentes}
                value={formAgente1}
                onChange={setFormAgente1}
                placeholder="Buscar agente 1 por nome, matrícula..."
                filtroCargo="Agente/Investigador"
                disabledIds={[formAgente2, formAgente3].filter(Boolean)}
                disabledMessage="Já selecionado nesta equipe"
              />
            </div>

            {/* Agente 2 com Autocomplete Universal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2937]">Agente de Custódia 2 *</Label>
              <ServidorAutocomplete
                servidores={agentes}
                value={formAgente2}
                onChange={setFormAgente2}
                placeholder="Buscar agente 2 por nome, matrícula..."
                filtroCargo="Agente/Investigador"
                disabledIds={[formAgente1, formAgente3].filter(Boolean)}
                disabledMessage="Já selecionado nesta equipe"
              />
            </div>

            {/* Agente 3 (Opcional) com Autocomplete Universal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Agente de Custódia 3 (Opcional)
                </Label>
                {formAgente3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormAgente3('')}
                    className="h-6 text-[10px] text-red-600 px-1 hover:bg-red-50"
                  >
                    Remover 3º Agente
                  </Button>
                )}
              </div>
              <ServidorAutocomplete
                servidores={agentes}
                value={formAgente3}
                onChange={setFormAgente3}
                placeholder="Buscar 3º agente (opcional)..."
                filtroCargo="Agente/Investigador"
                disabledIds={[formAgente1, formAgente2].filter(Boolean)}
                disabledMessage="Já selecionado nesta equipe"
                labelVazio="Nenhum (Composição padrão com 2 agentes)"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E5E9F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingDia(null)}
              className="border-[#D1D5DB]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarDia}
              disabled={salvandoDia}
              className="bg-[#0B2545] hover:bg-[#081A33] text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {salvandoDia ? 'Salvando...' : 'Salvar Custódia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação Inteligente para Sobreposição de Plantões */}
      <ConfirmacaoOperacionalModal
        open={modalConfirmacaoOpen}
        onOpenChange={setModalConfirmacaoOpen}
        onConfirm={() => {
          if (acaoAposConfirmacao) {
            acaoAposConfirmacao()
            setAcaoAposConfirmacao(null)
          }
        }}
        title="Você realmente confirma essa inclusão/alteração fora do padrão?"
        consequencia={consequenciaConfirmacao}
        confirmText="Sim, confirmar"
        cancelText="Cancelar"
      />
    </div>
  )
}
