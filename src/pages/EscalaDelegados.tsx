import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Shield,
  Printer,
  Phone,
  MessageCircle,
  RefreshCw,
  Calendar,
  UserCheck,
  AlertCircle,
  Clock,
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
import { escalasService, servidoresService, feriadosService } from '@/services/policeServices'
import type { Escala, Servidor, Feriado, TipoDiaEscala } from '@/types/police'
import { formatarTelefone, formatarNumeroWhatsapp } from '@/lib/escalaRules'
import useRealtime from '@/hooks/use-realtime'

export default function EscalaDelegados() {
  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [escalas, setEscalas] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [esc, srv, feri] = await Promise.all([
        escalasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
        feriadosService.getAll(),
      ])
      setEscalas(esc)
      setServidores(srv)
      setFeriados(feri)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar escala de delegados.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('escalas', () => carregarDados())
  useRealtime('servidores', () => carregarDados())
  useRealtime('feriados', () => carregarDados())

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

  // Determinar texto da Coluna 2: "DIA DA SEMANA E REGIME", ex: "TERÇA - 14hs", "SÁBADO - 24hs"
  const getDiaSemanaERegime = useCallback((dataObj: Date, tipoDia: TipoDiaEscala) => {
    const diaSemanaTexto = dataObj
      .toLocaleDateString('pt-BR', { weekday: 'long' })
      .toUpperCase()
      .replace('-FEIRA', '')
      .trim()

    const is24h = tipoDia === 'Sábado' || tipoDia === 'Domingo' || tipoDia === 'Feriado'
    const regime = is24h ? '24hs' : '14hs'

    return {
      texto: `${diaSemanaTexto} - ${regime}`,
      isDiferenciado: is24h,
      diaSemanaTexto,
      regime,
    }
  }, [])

  // Grade consolidada de Delegados
  const gradeDelegados = useMemo(() => {
    const list = []
    const escalasMap = new Map<number, Escala>()
    for (const e of escalas) {
      escalasMap.set(e.dia, e)
    }

    const servidoresMap = new Map<string, Servidor>()
    for (const s of servidores) {
      servidoresMap.set(s.id, s)
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const escala = escalasMap.get(d)
      const delegado = escala?.delegado ? servidoresMap.get(escala.delegado) || null : null
      const { texto: diaSemanaRegime, isDiferenciado } = getDiaSemanaERegime(dataObj, tipoDia)

      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        diaSemanaRegime,
        isDiferenciado,
        delegado,
      })
    }

    return list
  }, [ano, mes, diasNoMes, escalas, servidores, getTipoDia, getFeriadoDoDia, getDiaSemanaERegime])

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
      {/* Barra Superior / Header de Controles (Não imprime) */}
      <div className="no-print bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Mural Institucional • Plantão de Autoridades Policiais
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#0B2545]" />
            Escala de Delegados
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Painel exclusivo com telefones operacionais, discagem rápida e layout de impressão em A4
            Retrato para mural.
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
            Imprimir Escala de Delegados (A4 Retrato)
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

      {/* Legenda Informativa (Não imprime) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0B2545]" />
          <span className="font-semibold text-[#0B2545]">Regimes de Plantão:</span>
          <span className="text-[#6B7280]">
            Dias Úteis: 14 Horas (18h às 08h) | Finais de Semana e Feriados: 24 Horas (08h às 08h)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block" />
            <span className="text-slate-700">Dias Úteis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C9A227] inline-block" />
            <span className="text-[#C9A227] font-bold">Sáb / Dom / Feriado (24hs)</span>
          </div>
        </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO E IMPRESSÃO (A4 VERTICAL / RETRATO) */}
      <div className="print-portrait bg-white rounded-xl border border-[#E5E9F0] p-6 sm:p-8 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho Institucional do Mural */}
        <div className="border-b-2 border-[#0B2545] pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#0B2545] text-[#C9A227] flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B2545] uppercase tracking-wide leading-tight">
                Secretaria de Estado da Segurança e Defesa Social
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
                POLÍCIA CIVIL • ESCALA DE PLANTÃO DE DELEGADOS DE POLÍCIA
              </p>
              <p className="text-xs text-[#6B7280]">
                Mês de Referência:{' '}
                <strong>
                  {mesesNomes[mes - 1].toUpperCase()} DE {ano}
                </strong>
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#6B7280] hidden sm:block print:block">
            <p className="font-semibold text-[#0B2545]">Mural Operacional</p>
            <p>Atualizado em: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* TABELA MURAL DE DELEGADOS COM 4 COLUNAS EXATAS */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs border border-[#0B2545]/30">
            <thead>
              <tr className="bg-[#0B2545] text-white font-semibold">
                <th className="py-2.5 px-3 border border-[#0B2545] text-center w-20">
                  <span className="text-[11px] uppercase tracking-wider">DIA</span>
                </th>
                <th className="py-2.5 px-3 border border-[#0B2545] w-48 text-left">
                  <span className="text-[11px] uppercase tracking-wider">
                    DIA DA SEMANA E REGIME
                  </span>
                </th>
                <th className="py-2.5 px-3 border border-[#0B2545] text-left">
                  <span className="text-[11px] uppercase tracking-wider">DELEGADO(A)</span>
                </th>
                <th className="py-2.5 px-3 border border-[#0B2545] text-left w-64 print:w-48">
                  <span className="text-[11px] uppercase tracking-wider">TELEFONE OPERACIONAL</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-[#6B7280]">
                    Carregando escala de delegados...
                  </td>
                </tr>
              ) : (
                gradeDelegados.map((item, idx) => {
                  const del = item.delegado
                  const telefone = del?.telefone || ''
                  const telefoneFormatado = telefone ? formatarTelefone(telefone) : ''
                  const numeroWa = telefone ? formatarNumeroWhatsapp(telefone) : ''

                  // Cores diferenciadas para Sábado, Domingo e Feriado (dourado #C9A227 ou azul diferenciado)
                  return (
                    <tr
                      key={item.dia}
                      className={`transition-colors ${
                        item.isDiferenciado
                          ? 'bg-[#FFFDF5] font-medium'
                          : idx % 2 === 1
                            ? 'bg-[#F9FAFB]'
                            : 'bg-white'
                      }`}
                    >
                      {/* Coluna 1: DIA (número em destaque grande) */}
                      <td className="py-2.5 px-3 text-center border-r border-[#E5E9F0]">
                        <span
                          className={`text-lg sm:text-xl font-extrabold block leading-tight ${
                            item.isDiferenciado ? 'text-[#C9A227]' : 'text-[#0B2545]'
                          }`}
                        >
                          {String(item.dia).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Coluna 2: DIA DA SEMANA E REGIME */}
                      <td className="py-2.5 px-3 border-r border-[#E5E9F0]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold tracking-wide uppercase ${
                              item.isDiferenciado ? 'text-[#C9A227]' : 'text-[#1F2937]'
                            }`}
                          >
                            {item.diaSemanaRegime}
                          </span>
                          {item.feriadoInfo && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 border-[#C9A227] text-[#C9A227] bg-[#FDF6E3] font-semibold print:hidden"
                            >
                              ★ Feriado
                            </Badge>
                          )}
                        </div>
                        {item.feriadoInfo && (
                          <span className="text-[10px] text-[#C9A227] block truncate max-w-[200px]">
                            {item.feriadoInfo.nome}
                          </span>
                        )}
                      </td>

                      {/* Coluna 3: DELEGADO(A) */}
                      <td className="py-2.5 px-3 border-r border-[#E5E9F0]">
                        {del ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#0B2545]">{del.nome}</span>
                            {del.status === 'Inativo' && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 text-red-600 border-red-200"
                              >
                                Inativo
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6B7280] italic text-xs">
                            (Nenhum delegado alocado)
                          </span>
                        )}
                      </td>

                      {/* Coluna 4: TELEFONE OPERACIONAL (tel: e wa.me) */}
                      <td className="py-2.5 px-3">
                        {del && telefone ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Link de Chamada Direta (tel:) */}
                            <a
                              href={`tel:${telefone.replace(/\D/g, '')}`}
                              className="font-mono text-xs sm:text-sm font-semibold text-[#0B2545] hover:underline flex items-center gap-1"
                              title="Ligar para o Delegado"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#0B2545] print:hidden" />
                              {telefoneFormatado}
                            </a>

                            {/* Botão de WhatsApp (wa.me) - Oculto na impressão */}
                            {numeroWa && (
                              <a
                                href={`https://wa.me/${numeroWa}?text=${encodeURIComponent(
                                  `Olá Dr(a). ${del.nome}, contato operacional referente ao plantão do dia ${String(
                                    item.dia,
                                  ).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-medium transition-colors"
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : del ? (
                          <span className="text-[#6B7280] italic text-xs">
                            Telefone não cadastrado
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé Institucional com Espaço para Assinatura (Perfeito para fixar em mural) */}
        <div className="mt-8 pt-6 border-t border-[#E5E9F0] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#1F2937]">
          <div>
            <p className="font-semibold text-[#0B2545]">NOTAS OPERACIONAIS:</p>
            <p className="text-[#6B7280] text-[11px] mt-1">
              • As substituições extraordinárias devem ser previamente comunicadas e autorizadas
              pela Chefia de Polícia.
              <br />• Os números operacionais destinam-se exclusivamente para comunicações
              funcionais de urgência.
              <br />• Documento oficial homologado para afixação em mural do plantão policial.
            </p>
          </div>

          <div className="flex flex-col items-center justify-end text-center pt-4 sm:pt-0">
            <div className="w-56 border-b border-black mb-1.5" />
            <p className="font-bold text-[#0B2545] text-xs">DELEGADO(A) REGIONAL DE POLÍCIA</p>
            <p className="text-[10px] text-[#6B7280]">
              Chefia de Polícia Civil • Gestão de Escalas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
