import React, { useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  Clock,
  Briefcase,
  TrendingUp,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Escala, Servidor, Feriado, TipoDiaEscala } from '@/types/police'

export interface RelatorioHorasProps {
  mes: number
  ano: number
  escalas: Escala[]
  servidores: Servidor[]
  feriados: Feriado[]
  onImprimir?: () => void
}

export interface ServidorHorasCalculadas {
  servidor: Servidor
  cargo: string
  plantoesNormais: number
  horasNormais: number
  plantoesMajorados: number
  horasMajoradas: number
  totalPlantoes: number
  totalHoras: number
}

/**
 * Classificação conforme Regra 5:
 * - Horas Normais: plantões de Segunda a Quinta (dias úteis não feriados), 14h por plantão.
 * - Horas Majoradas: Sexta-feira (14h) e Sábados/Domingos/Feriados (24h).
 */
export function calcularRelatorioHoras(
  mes: number,
  ano: number,
  escalas: Escala[],
  servidores: Servidor[],
  feriados: Feriado[],
): {
  itens: ServidorHorasCalculadas[]
  totalGeralNormais: number
  totalGeralMajoradas: number
  totalGeralHoras: number
  mediaDelegados: number
  mediaEscrivaes: number
  mediaAgentes: number
  diasNoMes: number
} {
  const diasNoMes = new Date(ano, mes, 0).getDate()

  // Helper para verificar se dia é feriado
  const isFeriadoDia = (dia: number): boolean => {
    for (const f of feriados) {
      const fDate = new Date(f.data)
      const fDia = fDate.getUTCDate()
      const fMes = fDate.getUTCMonth() + 1
      const fAno = fDate.getUTCFullYear()
      if (f.recorrente) {
        if (fDia === dia && fMes === mes) return true
      } else {
        if (fDia === dia && fMes === mes && fAno === ano) return true
      }
    }
    return false
  }

  // Mapa de tipo e horas por dia
  // { tipo: 'normal' | 'majorada_14' | 'majorada_24', horas: number }
  const infoDiaMap = new Map<number, { isMajorada: boolean; horas: number }>()

  for (let d = 1; d <= diasNoMes; d++) {
    const feriado = isFeriadoDia(d)
    const dataObj = new Date(ano, mes - 1, d)
    const dayOfWeek = dataObj.getDay() // 0 = Dom, 1 = Seg, ..., 5 = Sex, 6 = Sab

    if (feriado || dayOfWeek === 0 || dayOfWeek === 6) {
      // Sábado, Domingo ou Feriado: Majorada 24h
      infoDiaMap.set(d, { isMajorada: true, horas: 24 })
    } else if (dayOfWeek === 5) {
      // Sexta-feira: Majorada 14h
      infoDiaMap.set(d, { isMajorada: true, horas: 14 })
    } else {
      // Segunda a Quinta dia útil: Normal 14h
      infoDiaMap.set(d, { isMajorada: false, horas: 14 })
    }
  }

  // Mapear escalas por dia
  const escalasPorDia = new Map<number, Escala>()
  for (const esc of escalas) {
    escalasPorDia.set(esc.dia, esc)
  }

  // Acumuladores por servidor
  const mapaServidores = new Map<
    string,
    {
      plantoesNormais: number
      horasNormais: number
      plantoesMajorados: number
      horasMajoradas: number
    }
  >()

  // Inicializa mapa para todos os servidores conhecidos
  for (const s of servidores) {
    mapaServidores.set(s.id, {
      plantoesNormais: 0,
      horasNormais: 0,
      plantoesMajorados: 0,
      horasMajoradas: 0,
    })
  }

  // Itera sobre os dias do mês computando presenças
  for (let d = 1; d <= diasNoMes; d++) {
    const esc = escalasPorDia.get(d)
    if (!esc) continue

    const diaInfo = infoDiaMap.get(d) || { isMajorada: false, horas: 14 }
    const escaladosNoDia = [
      esc.delegado,
      esc.escrivao,
      esc.agente1,
      esc.agente2,
      esc.agente3,
    ].filter(Boolean) as string[]

    for (const servId of escaladosNoDia) {
      let dados = mapaServidores.get(servId)
      if (!dados) {
        dados = { plantoesNormais: 0, horasNormais: 0, plantoesMajorados: 0, horasMajoradas: 0 }
        mapaServidores.set(servId, dados)
      }

      if (diaInfo.isMajorada) {
        dados.plantoesMajorados += 1
        dados.horasMajoradas += diaInfo.horas
      } else {
        dados.plantoesNormais += 1
        dados.horasNormais += diaInfo.horas
      }
    }
  }

  const itens: ServidorHorasCalculadas[] = []
  let totalGeralNormais = 0
  let totalGeralMajoradas = 0

  for (const serv of servidores) {
    const dados = mapaServidores.get(serv.id) || {
      plantoesNormais: 0,
      horasNormais: 0,
      plantoesMajorados: 0,
      horasMajoradas: 0,
    }

    const totalPlantoes = dados.plantoesNormais + dados.plantoesMajorados
    const totalHoras = dados.horasNormais + dados.horasMajoradas

    totalGeralNormais += dados.horasNormais
    totalGeralMajoradas += dados.horasMajoradas

    itens.push({
      servidor: serv,
      cargo: serv.cargo,
      plantoesNormais: dados.plantoesNormais,
      horasNormais: dados.horasNormais,
      plantoesMajorados: dados.plantoesMajorados,
      horasMajoradas: dados.horasMajoradas,
      totalPlantoes,
      totalHoras,
    })
  }

  // Ordenar: primeiro quem tem horas acumuladas (decrescente), depois alfabético
  itens.sort((a, b) => {
    if (b.totalHoras !== a.totalHoras) {
      return b.totalHoras - a.totalHoras
    }
    return a.servidor.nome.localeCompare(b.servidor.nome)
  })

  // Médias mensais por cargo
  const calcMediaCargo = (cargoNome: string) => {
    const doCargo = itens.filter(
      (it) =>
        it.cargo === cargoNome ||
        (Array.isArray(it.servidor.cargos_secundarios) &&
          it.servidor.cargos_secundarios.includes(cargoNome as any)),
    )
    if (doCargo.length === 0) return 0
    const soma = doCargo.reduce((acc, curr) => acc + curr.totalHoras, 0)
    return Math.round((soma / doCargo.length) * 10) / 10
  }

  return {
    itens,
    totalGeralNormais,
    totalGeralMajoradas,
    totalGeralHoras: totalGeralNormais + totalGeralMajoradas,
    mediaDelegados: calcMediaCargo('Delegado'),
    mediaEscrivaes: calcMediaCargo('Escrivão'),
    mediaAgentes: calcMediaCargo('Agente/Investigador'),
    diasNoMes,
  }
}

export function exportarRelatorioHorasCsv(
  mes: number,
  ano: number,
  dados: ServidorHorasCalculadas[],
) {
  const headers = [
    'Servidor Policial',
    'Matrícula',
    'Cargo',
    'Plantões Normais (Seg-Qui)',
    'Horas Normais (h)',
    'Plantões Majorados (Sex/FDS/Feriado)',
    'Horas Majoradas (h)',
    'Total de Plantões',
    'Carga Horária Total (h)',
  ]

  const rows = dados.map((d) => [
    `"${d.servidor.nome.replace(/"/g, '""')}"`,
    `"${d.servidor.matricula || ''}"`,
    `"${d.cargo}"`,
    d.plantoesNormais,
    d.horasNormais,
    d.plantoesMajorados,
    d.horasMajoradas,
    d.totalPlantoes,
    d.totalHoras,
  ])

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio_carga_horaria_${String(mes).padStart(2, '0')}_${ano}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function RelatorioHoras({
  mes,
  ano,
  escalas,
  servidores,
  feriados,
  onImprimir,
}: RelatorioHorasProps) {
  const dados = useMemo(() => {
    return calcularRelatorioHoras(mes, ano, escalas, servidores, feriados)
  }, [mes, ano, escalas, servidores, feriados])

  const handleExportCsv = () => {
    exportarRelatorioHorasCsv(mes, ano, dados.itens)
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

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Módulo */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              Auditoria & Carga Horária
            </span>
            <span className="text-xs text-[#6B7280]">
              {mesesNomes[mes - 1]} de {ano}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0B2545] mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0B2545]" />
            Relatório de Carga Horária: Horas Normais vs. Majoradas
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Classificação: <strong>Horas Normais</strong> (Segunda a Quinta, 14h) e{' '}
            <strong>Horas Majoradas</strong> (Sexta-feira 14h; Sábados, Domingos e Feriados 24h).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="border-[#0B2545] text-[#0B2545] hover:bg-slate-50 text-xs h-9"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
            size="sm"
            onClick={onImprimir || (() => window.print())}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir Demonstrativo (PDF)
          </Button>
        </div>
      </div>

      {/* Painel de Métricas / Cards no topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-[#E5E9F0] bg-white shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Horas Normais (Total)</span>
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-[#0B2545]">{dados.totalGeralNormais}h</div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Plantões Seg a Qui (14h/plantão)</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E9F0] bg-white shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Horas Majoradas (Total)</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-[#C9A227]">{dados.totalGeralMajoradas}h</div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Sextas (14h), FDS e Feriados (24h)</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E9F0] bg-white shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Média: Delegados</span>
              <Award className="w-3.5 h-3.5 text-[#0B2545]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-[#0B2545]">{dados.mediaDelegados}h</div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Média individual no mês</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E9F0] bg-white shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Média: Escrivães</span>
              <Award className="w-3.5 h-3.5 text-[#0B2545]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-[#0B2545]">{dados.mediaEscrivaes}h</div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Média individual no mês</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E9F0] bg-white shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Média: Agentes</span>
              <Award className="w-3.5 h-3.5 text-[#0B2545]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-[#0B2545]">{dados.mediaAgentes}h</div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Média individual no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada por Servidor */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5E9F0] bg-[#F5F7FA] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#0B2545]">
              Demonstrativo Individual de Carga Horária
            </h3>
            <p className="text-xs text-[#6B7280]">
              Total de {dados.itens.length} servidores cadastrados na base • {dados.totalGeralHoras}
              h totais acumuladas
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-white text-[#0B2545] border-slate-300">
            {mesesNomes[mes - 1]}/{ano}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-[#E5E9F0] text-[#0B2545] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Servidor Policial</th>
                <th className="py-3 px-3">Cargo</th>
                <th className="py-3 px-3 text-center bg-blue-50/40">Plantões Normais</th>
                <th className="py-3 px-3 text-center bg-blue-50/40">Horas Normais</th>
                <th className="py-3 px-3 text-center bg-amber-50/40">Plantões Majorados</th>
                <th className="py-3 px-3 text-center bg-amber-50/40">Horas Majoradas</th>
                <th className="py-3 px-3 text-center">Total Plantões</th>
                <th className="py-3 px-3 text-center font-bold text-[#0B2545]">Carga Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {dados.itens.map((it, idx) => (
                <tr
                  key={it.servidor.id}
                  className={`hover:bg-[#F5F7FA] transition-colors ${
                    it.totalHoras > 0
                      ? idx % 2 === 1
                        ? 'bg-[#F9FAFB]'
                        : 'bg-white'
                      : 'opacity-60 bg-gray-50/50'
                  }`}
                >
                  <td className="py-2.5 px-3 font-medium text-[#1F2937]">
                    <div className="flex items-center gap-1.5">
                      <span>{it.servidor.nome}</span>
                      {it.servidor.matricula && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          ({it.servidor.matricula})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px] py-0">
                      {it.cargo}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center bg-blue-50/20 font-mono">
                    {it.plantoesNormais}
                  </td>
                  <td className="py-2.5 px-3 text-center bg-blue-50/20 font-semibold text-blue-900 font-mono">
                    {it.horasNormais}h
                  </td>
                  <td className="py-2.5 px-3 text-center bg-amber-50/20 font-mono">
                    {it.plantoesMajorados}
                  </td>
                  <td className="py-2.5 px-3 text-center bg-amber-50/20 font-semibold text-amber-900 font-mono">
                    {it.horasMajoradas}h
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{it.totalPlantoes}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-sm text-[#0B2545] font-mono">
                    {it.totalHoras}h
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0B2545] text-white font-bold text-xs">
                <td colSpan={2} className="py-3 px-3 uppercase tracking-wider">
                  TOTAIS GERAIS ACUMULADOS
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {dados.itens.reduce((acc, c) => acc + c.plantoesNormais, 0)}
                </td>
                <td className="py-3 px-3 text-center font-mono">{dados.totalGeralNormais}h</td>
                <td className="py-3 px-3 text-center font-mono">
                  {dados.itens.reduce((acc, c) => acc + c.plantoesMajorados, 0)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-amber-300">
                  {dados.totalGeralMajoradas}h
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {dados.itens.reduce((acc, c) => acc + c.totalPlantoes, 0)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-sm text-amber-300">
                  {dados.totalGeralHoras}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
