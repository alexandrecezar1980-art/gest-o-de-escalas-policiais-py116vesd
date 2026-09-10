import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Eye, Printer, Calendar, Lock, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'
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
import { useNavigate } from 'react-router-dom'

export default function EscalaPublica() {
  const navigate = useNavigate()

  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [escalas, setEscalas] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [atribuicoesTexto, setAtribuicoesTexto] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Filtro opcional por servidor ou cargo para os visitantes
  const [buscaServidor, setBuscaServidor] = useState<string>('todos')

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
        setAtribuicoesTexto('<p>Nenhuma atribuição cadastrada para este mês.</p>')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar escala pública.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

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

  const diasNoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate()
  }, [ano, mes])

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

      // Filtro por servidor
      if (buscaServidor !== 'todos' && esc) {
        const ids = [esc.delegado, esc.escrivao, esc.agente1, esc.agente2, esc.agente3]
        if (!ids.includes(buscaServidor)) {
          continue // pular dia se o servidor filtrado não estiver escalado
        }
      }

      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        escala: esc,
      })
    }

    return list
  }, [ano, mes, diasNoMes, getTipoDia, getFeriadoDoDia, escalas, buscaServidor])

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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header Público Simplificado com aviso de Visitante */}
      <header className="no-print bg-white border-b border-[#E5E9F0] shadow-sm sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-10 flex items-center justify-center">
              <BrasaoPCPB className="h-10 w-auto max-w-[40px] drop-shadow-sm" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-[#0B2545] leading-tight">
                Escala Policial Operacional
              </h1>
              <p className="text-xs text-[#6B7280]">
                Polícia Civil PB • Modo Visitante (Somente Leitura)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white text-xs h-9"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Área do Administrador
            </Button>
          </div>
        </div>

        {/* Faixa amarela de aviso visitante */}
        <div className="bg-[#0B2545] text-white text-xs py-2 px-4 border-t border-[#0B2545]">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#C9A227]" />
              <strong>Acesso Público:</strong> Você está visualizando as escalas como Visitante.
              Botões de impressão e filtros de visualização habilitados.
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Barra de Filtros e Ações */}
        <div className="no-print bg-white p-5 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-[#1F2937]">Filtrar Servidor:</Label>
              <Select value={buscaServidor} onValueChange={setBuscaServidor}>
                <SelectTrigger className="w-[200px] h-9 border-[#D1D5DB] text-xs">
                  <SelectValue placeholder="Todos os Servidores" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="todos">Todos os Servidores</SelectItem>
                  {servidores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir Escala (A4)
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA] text-xs h-9 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* ÁREA DA FOLHA IMPRESSA / A4 PAISAGEM */}
        <div className="bg-white rounded-xl border border-[#E5E9F0] p-6 sm:p-8 shadow-sm print:p-0 print:border-none print:shadow-none">
          {/* Cabeçalho Oficial */}
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
                  20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
                </h2>
                <p className="text-xs font-semibold text-[#1F2937]">
                  ESCALA GERAL DE PLANTÃO POLICIAL OPERACIONAL — {mesesNomes[mes - 1].toUpperCase()}{' '}
                  DE {ano}
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  Regime: Dias Úteis (18h às 08h) • Sextas (18h às 08h) • Sáb/Dom/Feriados (08h às
                  08h)
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-[#6B7280]">
              <p>Consulta Pública</p>
              <p className="font-semibold text-[#0B2545]">Escala Homologada</p>
            </div>
          </div>

          {/* Tabela de Plantão */}
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

          {/* Atribuições dos Plantonistas (Somente Leitura) */}
          <div className="mt-6 pt-4 border-t-2 border-[#0B2545] break-inside-avoid print:break-inside-avoid">
            <h3 className="text-xs sm:text-sm font-bold text-[#0B2545] uppercase tracking-wider mb-2">
              ATRIBUIÇÕES DOS PLANTONISTAS
            </h3>
            <div className="print:text-[10px] print:overflow-visible print:h-auto">
              <RichTextEditor value={atribuicoesTexto} onChange={() => {}} disabled={true} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-[#E5E9F0] py-4 text-center text-xs text-[#6B7280]">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>20 DSOC - CAJAZEIRAS</span>
          <span>Acesso Visitante às Escalas de Plantão</span>
        </div>
      </footer>
    </div>
  )
}
