import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Save,
  FileText,
  Info,
  CheckCircle2,
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  escalasService,
  servidoresService,
  feriadosService,
  atribuicoesService,
} from '@/services/policeServices'
import type { Escala, Servidor, Feriado, TipoDiaEscala } from '@/types/police'
import { calcularHorariosAgentes, formatarDataBr } from '@/lib/escalaRules'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useAuth } from '@/context/AuthContext'
import useRealtime from '@/hooks/use-realtime'

export default function Relatorio() {
  const { isAdmin } = useAuth()
  const location = useLocation()

  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [escalas, setEscalas] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [atribuicoesTexto, setAtribuicoesTexto] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [salvandoAtribuicoes, setSalvandoAtribuicoes] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [esc, srv, feri, atrib] = await Promise.all([
        escalasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
        feriadosService.getAll(),
        atribuicoesService.getByMesAno(mes, ano),
      ])
      setEscalas(esc)
      setServidores(srv)
      setFeriados(feri)

      if (atrib?.conteudo) {
        setAtribuicoesTexto(atrib.conteudo)
      } else {
        // Texto padrão caso ainda não exista para este mês
        setAtribuicoesTexto(`<h3>ATRIBUIÇÕES DOS PLANTONISTAS</h3>
<p>Os servidores escalados para o regime de plantão policial deverão cumprir com presteza as atribuições inerentes a cada função:</p>
<ul>
  <li><strong>Delegado de Polícia:</strong> Coordenação da unidade, deliberação sobre procedimentos de flagrante delito, concessão de fiança legal e medidas urgentes.</li>
  <li><strong>Escrivão de Polícia:</strong> Formalização de autos de prisão, termos circunstanciados de ocorrência, termos de fiança e expedição de guias periciais.</li>
  <li><strong>Agentes / Investigadores:</strong> Diligências preliminares imediatas, atendimento e custódia provisória de detidos, triagem no plantão e segurança da equipe.</li>
</ul>`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar relatório da escala.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useEffect(() => {
    if (location.hash === '#atribuicoes') {
      setTimeout(() => {
        const el = document.getElementById('atribuicoes')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 250)
    }
  }, [location.hash, loading])

  useRealtime('escalas', () => carregarDados())
  useRealtime('atribuicoes', () => carregarDados())

  // Salvar Atribuições dos Plantonistas (Apenas Admin)
  const handleSalvarAtribuicoes = async () => {
    if (!isAdmin) return
    try {
      setSalvandoAtribuicoes(true)
      await atribuicoesService.save(mes, ano, atribuicoesTexto)
      toast.success('Atribuições dos Plantonistas salvas com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar atribuições.')
    } finally {
      setSalvandoAtribuicoes(false)
    }
  }

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

  const diasNoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate()
  }, [ano, mes])

  // Grade consolidada para o relatório
  const gradeRelatorio = useMemo(() => {
    const list = []
    const escalasMap = new Map<number, Escala>()
    for (const e of escalas) {
      escalasMap.set(e.dia, e)
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const esc = escalasMap.get(d)

      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        escala: esc,
      })
    }

    return list
  }, [ano, mes, diasNoMes, getTipoDia, getFeriadoDoDia, escalas])

  const getServidorNome = (id: string | undefined): string => {
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
    <div className="space-y-6">
      {/* Barra de Controles e Ações (Oculta na Impressão) */}
      <div className="no-print bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Relatório Oficial • Formato A4 Paisagem
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#0B2545]" />
            Relatório de Escala Operacional
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Visualização otimizada para impressão física ou geração de arquivo PDF em formato A4
            Paisagem.
          </p>
        </div>

        {/* Seletores e Botões de Impressão */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-[#1F2937]">Mês:</Label>
            <Select value={String(mes)} onValueChange={(val) => setMes(parseInt(val, 10))}>
              <SelectTrigger className="w-[140px] h-9 border-[#D1D5DB] text-xs">
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
              <SelectTrigger className="w-[100px] h-9 border-[#D1D5DB] text-xs">
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
            className="bg-[#0B2545] hover:bg-[#081A33] text-white shadow-sm h-9 text-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Escala
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA] h-9 text-xs flex items-center gap-1.5"
            title="Utilize o diálogo de impressão para Salvar como PDF"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO / FOLHA A4 PAISAGEM */}
      <div className="print-landscape bg-white rounded-xl border border-[#E5E9F0] p-6 sm:p-8 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho Institucional do Relatório */}
        <div className="border-b-2 border-[#0B2545] pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
              <BrasaoPCPB className="h-14 w-auto max-w-[56px] drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                POLÍCIA CIVIL DO ESTADO DA PARAÍBA
              </p>
              <h2 className="text-base sm:text-lg font-bold text-[#0B2545] uppercase tracking-wide">
                20ª DELEGACIA SECCIONAL
              </h2>
              <p className="text-xs font-semibold text-[#1F2937]">
                ESCALA GERAL DE PLANTÃO POLICIAL OPERACIONAL — {mesesNomes[mes - 1].toUpperCase()}{' '}
                DE {ano}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Regime de Plantão: Dias Úteis e Sextas (14 Horas - 18h às 08h) | Finais de Semana e
                Feriados (24 Horas - 08h às 08h)
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#6B7280]">
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="font-semibold text-[#0B2545]">Oficial / Homologada</p>
          </div>
        </div>

        {/* Tabela do Relatório */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] print:text-[10px] border border-[#0B2545]/40">
            <thead>
              <tr className="bg-[#0B2545] text-white font-semibold">
                <th className="py-2 px-2 border border-[#0B2545] text-center w-12">DATA</th>
                <th className="py-2 px-2 border border-[#0B2545] text-center w-14">DIA</th>
                <th className="py-2 px-2 border border-[#0B2545] w-24">TIPO</th>
                <th className="py-2 px-2 border border-[#0B2545]">DELEGADO(A)</th>
                <th className="py-2 px-2 border border-[#0B2545]">ESCRIVÃO(Ã)</th>
                <th className="py-2 px-2 border border-[#0B2545]">AGENTE 1</th>
                <th className="py-2 px-2 border border-[#0B2545]">AGENTE 2</th>
                <th className="py-2 px-2 border border-[#0B2545]">AGENTE 3</th>
                <th className="py-2 px-2 border border-[#0B2545]">HORÁRIOS DOS AGENTES</th>
              </tr>
            </thead>
            <tbody>
              {gradeRelatorio.map((item, idx) => {
                const d = item.dia
                const diaSemana = item.dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })
                const esc = item.escala
                const temAgente3 = !!esc?.agente3
                const horarios = calcularHorariosAgentes(item.tipoDia, temAgente3)

                const isFeriado = item.tipoDia === 'Feriado'
                const isFds = item.tipoDia === 'Sábado' || item.tipoDia === 'Domingo'

                return (
                  <tr
                    key={d}
                    className={`border-b border-[#E5E9F0] ${
                      isFeriado
                        ? 'bg-[#FFFDF5]'
                        : isFds
                          ? 'bg-[#F8FAFC]'
                          : idx % 2 === 1
                            ? 'bg-[#F9FAFB]'
                            : 'bg-white'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center font-bold text-[#0B2545] border-r border-[#E5E9F0]">
                      {String(d).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 text-center font-semibold text-[#1F2937] uppercase border-r border-[#E5E9F0]">
                      {diaSemana}
                    </td>
                    <td className="py-1.5 px-2 font-medium border-r border-[#E5E9F0]">
                      <span className={isFeriado ? 'text-[#C9A227] font-bold' : ''}>
                        {item.tipoDia}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-medium text-[#0B2545] border-r border-[#E5E9F0]">
                      {getServidorNome(esc?.delegado)}
                    </td>
                    <td className="py-1.5 px-2 text-[#1F2937] border-r border-[#E5E9F0]">
                      {getServidorNome(esc?.escrivao)}
                    </td>
                    <td className="py-1.5 px-2 text-[#1F2937] border-r border-[#E5E9F0]">
                      {getServidorNome(esc?.agente1)}
                    </td>
                    <td className="py-1.5 px-2 text-[#1F2937] border-r border-[#E5E9F0]">
                      {getServidorNome(esc?.agente2)}
                    </td>
                    <td className="py-1.5 px-2 text-[#1F2937] border-r border-[#E5E9F0]">
                      {esc?.agente3 ? getServidorNome(esc.agente3) : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-[10px] font-mono leading-tight">
                      <span className="block text-[#0B2545] font-sans font-semibold">
                        {horarios.plantaoDesc}
                      </span>
                      <span>1: {horarios.agente1}</span> | <span>2: {horarios.agente2}</span>
                      {horarios.agente3 && <span> | 3: {horarios.agente3}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* SEÇÃO: ATRIBUIÇÕES DOS PLANTONISTAS (EDITÁVEL PELO ADMIN, EXIBIDO NA IMPRESSÃO) */}
        <div
          id="atribuicoes"
          className="mt-6 pt-4 border-t-2 border-[#0B2545] scroll-mt-20 break-inside-avoid print:break-inside-avoid"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0B2545]" />
              ATRIBUIÇÕES DOS PLANTONISTAS
            </h3>
            {isAdmin && (
              <div className="no-print">
                <Button
                  size="sm"
                  onClick={handleSalvarAtribuicoes}
                  disabled={salvandoAtribuicoes}
                  className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-7"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {salvandoAtribuicoes ? 'Salvando...' : 'Salvar Atribuições'}
                </Button>
              </div>
            )}
          </div>

          {/* Campo Rich Text Editável pelo Admin ou Exibido como Leitura */}
          <div className="print:text-[10px] print:overflow-visible print:h-auto">
            <RichTextEditor
              value={atribuicoesTexto}
              onChange={setAtribuicoesTexto}
              disabled={!isAdmin}
            />
          </div>

          {/* Assinaturas para Impressão */}
          <div className="mt-12 pt-8 border-t border-[#D1D5DB] grid grid-cols-2 gap-8 text-center text-xs print:grid break-inside-avoid print:break-inside-avoid">
            <div>
              <div className="border-t border-[#1F2937] pt-1 w-3/4 mx-auto font-semibold text-[#0B2545]">
                Dr. Antonio Luiz Barbosa Netto
              </div>
              <p className="text-[10px] text-[#6B7280]">Delegado Seccional 20ª DPSC</p>
            </div>
            <div>
              <div className="border-t border-[#1F2937] pt-1 w-3/4 mx-auto font-semibold text-[#0B2545]">
                Coordenação de Escalas e Operações
              </div>
              <p className="text-[10px] text-[#6B7280]">20ª DSPC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
