import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Shield,
  Printer,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  Check,
  Edit2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { permanenciasService, servidoresService } from '@/services/policeServices'
import type { Permanencia, Servidor } from '@/types/police'
import useRealtime from '@/hooks/use-realtime'

export default function EscalaPermanencia() {
  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [permanencias, setPermanencias] = useState<Permanencia[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)

  // Estado local para edições rápidas { [dia]: { agente1: string, agente2: string } }
  const [alocacoes, setAlocacoes] = useState<Record<number, { agente1: string; agente2: string }>>(
    {},
  )
  const [salvandoDia, setSalvandoDia] = useState<number | null>(null)
  const [salvandoTodos, setSalvandoTodos] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [perm, srv] = await Promise.all([
        permanenciasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
      ])
      setPermanencias(perm)
      setServidores(srv)

      // Inicializa estado de alocações com o que veio do banco
      const initial: Record<number, { agente1: string; agente2: string }> = {}
      for (const p of perm) {
        initial[p.dia] = {
          agente1: p.agente1 || '',
          agente2: p.agente2 || '',
        }
      }
      setAlocacoes(initial)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar escala de permanência.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('permanencias', () => carregarDados())

  const agentes = useMemo(
    () => servidores.filter((s) => s.cargo === 'Agente/Investigador' && s.status === 'Ativo'),
    [servidores],
  )

  const diasNoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate()
  }, [ano, mes])

  // Agrupamento automático dos dias úteis (Segunda a Sexta) POR DIA DA SEMANA
  // Ex: "Segundas-feiras: dias 7, 14, 21, 28"
  // "Terças-feiras: dias 1, 8, 15, 22, 29"
  // "Quartas-feiras: dias 2, 9, 16, 23, 30"
  // "Quintas-feiras: dias 3, 10, 17, 24"
  // "Sextas-feiras: dias 4, 11, 18, 25"
  const gruposDiasUteis = useMemo(() => {
    const grupos: {
      diaSemanaIndice: number // 1 a 5
      nome: string // ex: "Segundas-feiras"
      nomeSingular: string
      dias: {
        dia: number
        dataObj: Date
      }[]
    }[] = [
      { diaSemanaIndice: 1, nome: 'Segundas-feiras', nomeSingular: 'Segunda-feira', dias: [] },
      { diaSemanaIndice: 2, nome: 'Terças-feiras', nomeSingular: 'Terça-feira', dias: [] },
      { diaSemanaIndice: 3, nome: 'Quartas-feiras', nomeSingular: 'Quarta-feira', dias: [] },
      { diaSemanaIndice: 4, nome: 'Quintas-feiras', nomeSingular: 'Quinta-feira', dias: [] },
      { diaSemanaIndice: 5, nome: 'Sextas-feiras', nomeSingular: 'Sexta-feira', dias: [] },
    ]

    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const dayOfWeek = dataObj.getDay() // 0 = Dom, 1 = Seg, ..., 5 = Sex, 6 = Sab
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const grupo = grupos.find((g) => g.diaSemanaIndice === dayOfWeek)
        if (grupo) {
          grupo.dias.push({ dia: d, dataObj })
        }
      }
    }

    return grupos
  }, [ano, mes, diasNoMes])

  // Total de dias úteis no mês
  const totalDiasUteis = useMemo(() => {
    return gruposDiasUteis.reduce((acc, g) => acc + g.dias.length, 0)
  }, [gruposDiasUteis])

  // Total de dias completos (com 2 agentes válidos e distintos selecionados)
  const totalDiasCompletos = useMemo(() => {
    let count = 0
    for (const g of gruposDiasUteis) {
      for (const d of g.dias) {
        const item = alocacoes[d.dia]
        if (item && item.agente1 && item.agente2 && item.agente1 !== item.agente2) {
          count++
        }
      }
    }
    return count
  }, [gruposDiasUteis, alocacoes])

  const handleUpdateAgente = (dia: number, slot: 'agente1' | 'agente2', servidorId: string) => {
    setAlocacoes((prev) => {
      const current = prev[dia] || { agente1: '', agente2: '' }
      return {
        ...prev,
        [dia]: {
          ...current,
          [slot]: servidorId,
        },
      }
    })
  }

  // Salvar um dia específico
  const handleSalvarDia = async (dia: number) => {
    const aloc = alocacoes[dia] || { agente1: '', agente2: '' }
    if (!aloc.agente1 || !aloc.agente2) {
      toast.warning(
        `Dia ${String(dia).padStart(2, '0')}: Selecione OBRIGATORIAMENTE os 02 Agentes Permanentes.`,
      )
      return
    }

    if (aloc.agente1 === aloc.agente2) {
      toast.error(
        `Dia ${String(dia).padStart(2, '0')}: Os 2 agentes selecionados devem ser diferentes entre si.`,
      )
      return
    }

    try {
      setSalvandoDia(dia)
      await permanenciasService.upsertDia({
        mes,
        ano,
        dia,
        agente1: aloc.agente1,
        agente2: aloc.agente2,
      })
      toast.success(`Permanência do dia ${String(dia).padStart(2, '0')} salva com sucesso!`)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao salvar dia ${dia}.`)
    } finally {
      setSalvandoDia(null)
    }
  }

  // Salvar todas as alterações pendentes da tela
  const handleSalvarTodos = async () => {
    // Validar se tem erros de servidores iguais em algum dia preenchido
    for (const g of gruposDiasUteis) {
      for (const d of g.dias) {
        const aloc = alocacoes[d.dia]
        if (aloc?.agente1 && aloc?.agente2 && aloc.agente1 === aloc.agente2) {
          toast.error(
            `Dia ${String(d.dia).padStart(2, '0')}: Os dois agentes não podem ser a mesma pessoa.`,
          )
          return
        }
      }
    }

    try {
      setSalvandoTodos(true)
      const promessas: Promise<unknown>[] = []

      for (const g of gruposDiasUteis) {
        for (const d of g.dias) {
          const aloc = alocacoes[d.dia]
          if (aloc && (aloc.agente1 || aloc.agente2)) {
            promessas.push(
              permanenciasService.upsertDia({
                mes,
                ano,
                dia: d.dia,
                agente1: aloc.agente1 || null,
                agente2: aloc.agente2 || null,
              }),
            )
          }
        }
      }

      await Promise.all(promessas)
      toast.success('Todas as escalas de permanência foram salvas!')
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar escala de permanência.')
    } finally {
      setSalvandoTodos(false)
    }
  }

  const getNomeServidor = (id?: string) => {
    if (!id) return '-'
    return servidores.find((s) => s.id === id)?.nome || '-'
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
              Atendimento Contínuo • Expediente Administrativo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0B2545]" />
            Escala de Permanência (Dias Úteis)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Agrupamento automático de segunda a sexta-feira por dia da semana com alocação
            obrigatória de 02 Agentes Permanentes.
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
            onClick={handleSalvarTodos}
            disabled={salvandoTodos}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white shadow-sm h-9 text-xs flex items-center gap-1.5 font-medium"
          >
            <Save className="w-4 h-4" />
            {salvandoTodos ? 'Salvando...' : 'Salvar Todas as Alocações'}
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA] h-9 text-xs flex items-center gap-1.5 font-medium"
          >
            <Printer className="w-4 h-4" />
            Imprimir
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

      {/* Barra de Status e Validação Geral (Não imprime) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold border-[#0B2545] text-[#0B2545] bg-blue-50/50 py-1"
          >
            {totalDiasCompletos} de {totalDiasUteis} dias úteis completos
          </Badge>
          {totalDiasCompletos < totalDiasUteis ? (
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Há dias incompletos com menos de 02 agentes alocados (destacados em amarelo).
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Todos os dias úteis deste mês estão com a permanência completa!
            </span>
          )}
        </div>

        <div className="text-[11px] text-[#6B7280]">
          Regra: <strong>Obrigatório 02 Agentes</strong> distintos por dia útil de expediente.
        </div>
      </div>

      {/* VISUALIZAÇÃO EM GRUPOS / CARDS POR DIA DA SEMANA */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-[#E5E9F0] text-center text-sm text-[#6B7280]">
            Carregando grupos de dias úteis da permanência...
          </div>
        ) : (
          gruposDiasUteis.map((grupo) => {
            const diasListaTexto = grupo.dias.map((d) => d.dia).join(', ')

            return (
              <div
                key={grupo.diaSemanaIndice}
                className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden"
              >
                {/* Cabeçalho do Grupo por Dia da Semana */}
                <div className="bg-[#F5F7FA] border-b border-[#E5E9F0] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs">
                      {grupo.nomeSingular.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[#0B2545]">
                        {grupo.nome}:{' '}
                        <span className="font-semibold text-[#1F2937]">dias {diasListaTexto}</span>
                      </h2>
                      <p className="text-[11px] text-[#6B7280]">
                        {grupo.dias.length} ocorrência(s) no mês de {mesesNomes[mes - 1]} de {ano}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#6B7280]">
                    2 Agentes Permanentes / dia
                  </span>
                </div>

                {/* Grade dos dias deste grupo */}
                <div className="p-4 sm:p-5 space-y-3">
                  {grupo.dias.map(({ dia, dataObj }) => {
                    const aloc = alocacoes[dia] || { agente1: '', agente2: '' }
                    const hasBoth = !!aloc.agente1 && !!aloc.agente2
                    const isSame = hasBoth && aloc.agente1 === aloc.agente2
                    const isIncomplete = !hasBoth || isSame

                    return (
                      <div
                        key={dia}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isIncomplete
                            ? 'bg-[#FFFDF5] border-amber-300'
                            : 'bg-white border-[#E5E9F0] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Identificação do Dia */}
                          <div className="flex items-center gap-3 w-full lg:w-48 shrink-0">
                            <div
                              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border font-bold ${
                                isIncomplete
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : 'bg-[#0B2545] border-[#0B2545] text-white'
                              }`}
                            >
                              <span className="text-base leading-none">
                                {String(dia).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider mt-0.5">
                                {mesesNomes[mes - 1].slice(0, 3)}
                              </span>
                            </div>

                            <div>
                              <p className="font-bold text-xs text-[#0B2545]">
                                Dia {String(dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {isIncomplete ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 border-amber-400 text-amber-800 bg-amber-50 flex items-center gap-1 font-semibold"
                                  >
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    {isSame ? 'Servidores iguais' : 'Incompleto'}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 border-emerald-400 text-emerald-800 bg-emerald-50 flex items-center gap-1 font-semibold"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Alocado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Seletores dos 2 Agentes Permanentes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            {/* Agente 1 */}
                            <div className="space-y-1">
                              <Label className="text-[11px] font-semibold text-[#1F2937] flex items-center justify-between">
                                <span>Agente Permanente 1 *</span>
                                {aloc.agente1 && (
                                  <span className="text-[10px] text-emerald-700 font-normal">
                                    Selecionado
                                  </span>
                                )}
                              </Label>
                              <Select
                                value={aloc.agente1}
                                onValueChange={(val) => handleUpdateAgente(dia, 'agente1', val)}
                              >
                                <SelectTrigger
                                  className={`h-9 text-xs border ${
                                    !aloc.agente1
                                      ? 'border-amber-300 bg-amber-50/30'
                                      : 'border-[#D1D5DB]'
                                  }`}
                                >
                                  <SelectValue placeholder="Selecione o 1º Agente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {agentes.map((ag) => (
                                    <SelectItem
                                      key={ag.id}
                                      value={ag.id}
                                      disabled={ag.id === aloc.agente2}
                                    >
                                      {ag.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Agente 2 */}
                            <div className="space-y-1">
                              <Label className="text-[11px] font-semibold text-[#1F2937] flex items-center justify-between">
                                <span>Agente Permanente 2 *</span>
                                {aloc.agente2 && (
                                  <span className="text-[10px] text-emerald-700 font-normal">
                                    Selecionado
                                  </span>
                                )}
                              </Label>
                              <Select
                                value={aloc.agente2}
                                onValueChange={(val) => handleUpdateAgente(dia, 'agente2', val)}
                              >
                                <SelectTrigger
                                  className={`h-9 text-xs border ${
                                    !aloc.agente2
                                      ? 'border-amber-300 bg-amber-50/30'
                                      : 'border-[#D1D5DB]'
                                  }`}
                                >
                                  <SelectValue placeholder="Selecione o 2º Agente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {agentes.map((ag) => (
                                    <SelectItem
                                      key={ag.id}
                                      value={ag.id}
                                      disabled={ag.id === aloc.agente1}
                                    >
                                      {ag.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Botão de Salvar Individual deste Dia (Não imprime) */}
                          <div className="no-print flex items-center justify-end shrink-0 pt-1 lg:pt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSalvarDia(dia)}
                              disabled={salvandoDia === dia}
                              className="h-9 text-xs border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white transition-colors"
                            >
                              <Save className="w-3.5 h-3.5 mr-1" />
                              {salvandoDia === dia ? 'Salvando...' : 'Salvar Dia'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ÁREA DE IMPRESSÃO (Visível apenas ao imprimir) */}
      <div className="hidden print:block print:p-0 print:border-none">
        <div className="border-b-2 border-[#0B2545] pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B2545] uppercase">
              Secretaria de Estado da Segurança e Defesa Social • Polícia Civil
            </h2>
            <p className="text-xs font-semibold text-[#1F2937]">
              ESCALA DE PERMANÊNCIA (DIAS ÚTEIS DE EXPEDIENTE) — {mesesNomes[mes - 1].toUpperCase()}
              /{ano}
            </p>
          </div>
          <div className="text-right text-[10px] text-[#6B7280]">
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-[10px] border border-[#0B2545]">
          <thead>
            <tr className="bg-[#0B2545] text-white">
              <th className="py-2 px-2 border border-[#0B2545] text-center w-16">DATA</th>
              <th className="py-2 px-2 border border-[#0B2545] text-left w-28">DIA DA SEMANA</th>
              <th className="py-2 px-2 border border-[#0B2545] text-left">AGENTE PERMANENTE 1</th>
              <th className="py-2 px-2 border border-[#0B2545] text-left">AGENTE PERMANENTE 2</th>
            </tr>
          </thead>
          <tbody>
            {gruposDiasUteis.flatMap((g) =>
              g.dias.map((d) => {
                const aloc = alocacoes[d.dia]
                return (
                  <tr key={d.dia} className="border-b border-gray-200">
                    <td className="py-1.5 px-2 text-center font-bold border-r border-gray-200">
                      {String(d.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 font-medium border-r border-gray-200">
                      {g.nomeSingular}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200">
                      {getNomeServidor(aloc?.agente1)}
                    </td>
                    <td className="py-1.5 px-2">{getNomeServidor(aloc?.agente2)}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
