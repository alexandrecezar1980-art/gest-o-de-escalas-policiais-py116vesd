import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Building2,
  CalendarDays,
  CalendarCheck2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'
import BrasaoPCPB from '@/components/BrasaoPCPB'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  servidoresService,
  unidadesService,
  feriasService,
  feriadosService,
  escalasService,
} from '@/services/policeServices'
import type { Servidor, Unidade, Ferias, Feriado, Escala } from '@/types/police'
import { calcularHorariosAgentes, formatarDataBr } from '@/lib/escalaRules'
import useRealtime from '@/hooks/use-realtime'

export default function Index() {
  const navigate = useNavigate()

  const [servidores, setServidores] = useState<Servidor[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [escalasMes, setEscalasMes] = useState<Escala[]>([])
  const [loading, setLoading] = useState(true)

  const now = useMemo(() => new Date(), [])
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [srv, und, fer, feri, esc] = await Promise.all([
        servidoresService.getAll(),
        unidadesService.getAll(),
        feriasService.getAll(),
        feriadosService.getAll(),
        escalasService.getByMesAno(currentMonth, currentYear),
      ])
      setServidores(srv)
      setUnidades(und)
      setFerias(fer)
      setFeriados(feri)
      setEscalasMes(esc)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime updates
  useRealtime('servidores', () => loadData())
  useRealtime('unidades', () => loadData())
  useRealtime('ferias', () => loadData())
  useRealtime('escalas', () => loadData())

  // KPIs Calculations
  const totalServidores = servidores.length
  const servidoresAtivos = servidores.filter((s) => s.status === 'Ativo').length
  const totalUnidades = unidades.length

  // Servidores em férias no mês atual
  const servidoresEmFeriasMes = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1).getTime()
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime()

    const emFerias = ferias.filter((f) => {
      const start = new Date(f.inicio).getTime()
      const end = new Date(f.fim).getTime()
      return start <= monthEnd && end >= monthStart
    })

    return emFerias
  }, [ferias, currentMonth, currentYear])

  // Próximo Feriado no mês vigente ou futuro próximo
  const proximoFeriado = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const sorted = [...feriados]
      .filter((f) => {
        const d = new Date(f.data).getTime()
        return d >= today
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    return sorted[0] || null
  }, [feriados, now])

  // Próximos 7 dias de plantão a partir de hoje
  const proximosPlantoes = useMemo(() => {
    const todayDay = now.getDate()
    return escalasMes
      .filter((e) => e.dia >= todayDay && e.dia <= todayDay + 6)
      .sort((a, b) => a.dia - b.dia)
  }, [escalasMes, now])

  // Alertas: servidores em férias escalados no mês
  const alertasFeriasEscaladas = useMemo(() => {
    const list: { dia: number; servidorNome: string; cargo: string; feriasPeriodo: string }[] = []

    for (const esc of escalasMes) {
      const dataEscala = new Date(currentYear, currentMonth - 1, esc.dia)

      const checkServidor = (servidorId: string | undefined, cargo: string) => {
        if (!servidorId) return
        const f = feriasService.isServidorEmFerias(ferias, servidorId, dataEscala)
        if (f) {
          const s = servidores.find((srv) => srv.id === servidorId)
          list.push({
            dia: esc.dia,
            servidorNome: s?.nome || 'Servidor',
            cargo,
            feriasPeriodo: `${formatarDataBr(f.inicio)} até ${formatarDataBr(f.fim)}`,
          })
        }
      }

      checkServidor(esc.delegado, 'Delegado')
      checkServidor(esc.escrivao, 'Escrivão')
      checkServidor(esc.agente1, 'Agente 1')
      checkServidor(esc.agente2, 'Agente 2')
      checkServidor(esc.agente3, 'Agente 3')
    }

    return list
  }, [escalasMes, ferias, servidores, currentMonth, currentYear])

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0B2545] text-white hover:bg-[#0B2545]">
              Painel Geral de Controle
            </Badge>
            <span className="text-xs text-[#6B7280]">
              Mês de Referência:{' '}
              <strong>
                {mesesNomes[currentMonth - 1]} de {currentYear}
              </strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-2">Escalas Operacionais Policiais</h1>
          <p className="text-sm text-[#6B7280]">
            Visão consolidada do efetivo, unidades policiais, períodos de férias e escala mensal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => navigate('/escala-mensal')}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white shadow-sm"
          >
            <CalendarCheck2 className="w-4 h-4 mr-2" />
            Gerenciar Escala
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/relatorio')}
            className="border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Relatório / Imprimir
          </Button>
        </div>
      </div>

      {/* Grid de KPIs - 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="border-[#E5E9F0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Servidores Cadastrados
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0B2545]">{totalServidores}</div>
            <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{servidoresAtivos} ativos</span>
              <span>•</span>
              <span>{totalServidores - servidoresAtivos} inativos</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-[#E5E9F0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Delegacias e Unidades
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0B2545]">{totalUnidades}</div>
            <p className="text-xs text-[#6B7280] mt-1">
              Unidades operacionais com lotação cadastrada
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-[#E5E9F0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Servidores em Férias
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#D97706]">{servidoresEmFeriasMes.length}</div>
            <p className="text-xs text-[#6B7280] mt-1">
              Afastados no mês de {mesesNomes[currentMonth - 1]}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-[#E5E9F0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Próximo Feriado
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#C9A227] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {proximoFeriado ? (
              <>
                <div className="text-base font-bold text-[#0B2545] truncate">
                  {proximoFeriado.nome}
                </div>
                <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-[#C9A227] text-[#0B2545]"
                  >
                    {formatarDataBr(proximoFeriado.data)}
                  </Badge>
                  <span className="text-[11px]">({proximoFeriado.tipo})</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-[#6B7280]">Nenhum</div>
                <p className="text-xs text-[#6B7280] mt-1">Sem feriados próximos</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas Importantes de Férias Escaladas */}
      {alertasFeriasEscaladas.length > 0 && (
        <div className="bg-[#FDF3E7] border border-[#D97706]/40 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Alerta Operacional: Servidores em período de férias constam na escala mensal
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Os servidores abaixo estão escalados para plantão dentro do período regulamentar
                  de férias:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {alertasFeriasEscaladas.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 border border-[#D97706]/30 rounded-lg p-2.5 text-xs"
                  >
                    <div className="font-semibold text-[#0B2545] flex items-center justify-between">
                      <span>
                        Dia {String(item.dia).padStart(2, '0')}/
                        {String(currentMonth).padStart(2, '0')}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-300 text-amber-900 bg-amber-50"
                      >
                        {item.cargo}
                      </Badge>
                    </div>
                    <p className="text-[#1F2937] font-medium mt-1 truncate">{item.servidorNome}</p>
                    <p className="text-[11px] text-[#6B7280]">Férias: {item.feriasPeriodo}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Principal: Próximos Plantões e Acessos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Plantões (2 Colunas no Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-[#E5E9F0] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0B2545]" />
                  Próximos Plantões Previstos (7 Dias)
                </CardTitle>
                <CardDescription>
                  Composição da equipe operacional policial para os próximos dias
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/escala-mensal')}
                className="text-[#0B2545] hover:bg-[#F5F7FA]"
              >
                Ver Grade Completa
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-[#6B7280]">
                  Carregando dados da escala...
                </div>
              ) : proximosPlantoes.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#6B7280] bg-[#F5F7FA] rounded-lg">
                  Nenhum plantão registrado para os próximos 7 dias no mês corrente.
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/escala-mensal')}
                      className="bg-[#0B2545] text-white hover:bg-[#081A33]"
                    >
                      Preencher Escala Mensal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E9F0]">
                  {proximosPlantoes.map((p) => {
                    const dataObj = new Date(currentYear, currentMonth - 1, p.dia)
                    const tem3Agentes = !!p.agente3
                    const horarios = calcularHorariosAgentes(p.tipo_dia, tem3Agentes)

                    const delegadoName =
                      servidores.find((s) => s.id === p.delegado)?.nome || 'Não definido'
                    const escrivaoName =
                      servidores.find((s) => s.id === p.escrivao)?.nome || 'Não definido'
                    const ag1Name =
                      servidores.find((s) => s.id === p.agente1)?.nome || 'Não definido'
                    const ag2Name =
                      servidores.find((s) => s.id === p.agente2)?.nome || 'Não definido'
                    const ag3Name = servidores.find((s) => s.id === p.agente3)?.nome

                    const diaSemanaStr = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })

                    return (
                      <div key={p.id || p.dia} className="py-3 sm:py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0B2545] capitalize bg-[#F5F7FA] px-2.5 py-1 rounded border border-[#E5E9F0]">
                              {String(p.dia).padStart(2, '0')}/
                              {String(currentMonth).padStart(2, '0')} ({diaSemanaStr})
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[11px] font-medium ${
                                p.tipo_dia === 'Feriado'
                                  ? 'bg-[#FDF6E3] text-[#C9A227] border border-[#C9A227]'
                                  : p.tipo_dia === 'Sexta-Feira'
                                    ? 'bg-blue-50 text-blue-800'
                                    : p.tipo_dia === 'Sábado' || p.tipo_dia === 'Domingo'
                                      ? 'bg-indigo-50 text-indigo-800'
                                      : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {p.tipo_dia}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-[#0B2545]">
                            {horarios.plantaoDesc}
                          </span>
                        </div>

                        {/* Equipe do dia */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E9F0]">
                          <div>
                            <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">
                              Delegado
                            </span>
                            <p className="font-medium text-[#0B2545] truncate">{delegadoName}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">
                              Escrivão
                            </span>
                            <p className="font-medium text-[#0B2545] truncate">{escrivaoName}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">
                              Agentes Operacionais ({tem3Agentes ? '3 Agentes' : '2 Agentes'})
                            </span>
                            <p
                              className="font-medium text-[#0B2545] truncate"
                              title={`${ag1Name}, ${ag2Name}${ag3Name ? `, ${ag3Name}` : ''}`}
                            >
                              1: {ag1Name} | 2: {ag2Name} {ag3Name ? `| 3: ${ag3Name}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acessos Rápidos e Atalhos */}
        <div className="space-y-4">
          <Card className="border-[#E5E9F0] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#0B2545]">
                Módulos do Sistema
              </CardTitle>
              <CardDescription>Acesso rápido aos cadastros e rotinas operacionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                {
                  title: 'Cadastro de Servidores',
                  desc: 'Gerencie delegados, escrivães e agentes',
                  icon: Users,
                  to: '/servidores',
                  badge: `${totalServidores} cadastrados`,
                },
                {
                  title: 'Lotação das Unidades',
                  desc: 'DEAM, 1ª DD, 2ª DD, GTE e equipes',
                  icon: Building2,
                  to: '/locacao',
                  badge: `${totalUnidades} delegacias`,
                },
                {
                  title: 'Controle de Férias',
                  desc: 'Escalonamento e bloqueio preventivo',
                  icon: CalendarDays,
                  to: '/ferias',
                  badge: `${servidoresEmFeriasMes.length} no mês`,
                },
                {
                  title: 'Motor de Escala Mensal',
                  desc: 'Grade automática com regras 14h / 24h',
                  icon: CalendarCheck2,
                  to: '/escala-mensal',
                  badge: 'Operacional',
                },
                {
                  title: 'Relatório e Impressão A4',
                  desc: 'Escala em PDF com atribuições',
                  icon: FileSpreadsheet,
                  to: '/relatorio',
                  badge: 'A4 Paisagem',
                },
              ].map((mod) => {
                const Icon = mod.icon
                return (
                  <button
                    key={mod.to}
                    type="button"
                    onClick={() => navigate(mod.to)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-[#E5E9F0] bg-white hover:bg-[#F5F7FA] hover:border-[#0B2545]/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-[#0B2545]/5 text-[#0B2545] flex items-center justify-center group-hover:bg-[#0B2545] group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0B2545] group-hover:text-[#1D4E89]">
                          {mod.title}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">{mod.desc}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-[#0B2545] border-[#E5E9F0]"
                    >
                      {mod.badge}
                    </Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Card Institucional */}
          <div className="bg-[#0B2545] text-white p-5 rounded-xl shadow-sm border border-[#0B2545]">
            <div className="flex items-center gap-2 text-[#C9A227] mb-2 font-semibold text-xs tracking-wider uppercase">
              <BrasaoPCPB className="w-4 h-auto" />
              Regras das Escalas Policiais
            </div>
            <p className="text-xs text-white/90 leading-relaxed">
              <strong>Seg a Qui (14h):</strong> 1 Delegado, 1 Escrivão e 2 Agentes (18h-01h /
              01h-08h).
            </p>
            <p className="text-xs text-white/90 leading-relaxed mt-1">
              <strong>Sexta (14h) ou 3 Agentes:</strong> Divisão em 3 faixas (18h-24h / 24h-04h /
              04h-08h).
            </p>
            <p className="text-xs text-white/90 leading-relaxed mt-1">
              <strong>Sáb/Dom/Feriado (24h):</strong> 3 faixas de 8 horas (08h-16h / 16h-24h /
              24h-08h).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
