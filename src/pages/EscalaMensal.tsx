import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CalendarCheck2,
  CalendarDays,
  Sparkles,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  feriasService,
  feriadosService,
  permanenciasService,
  custodiasService,
} from '@/services/policeServices'
import type {
  Escala,
  Servidor,
  Ferias,
  Feriado,
  TipoDiaEscala,
  TipoFeriado,
  Permanencia,
  Custodia,
} from '@/types/police'
import {
  calcularHorariosAgentes,
  formatarDataBr,
  formatarTelefone,
  formatarNumeroWhatsapp,
  gerarTextoWhatsappPlantao,
} from '@/lib/escalaRules'
import ServidorAutocomplete from '@/components/ServidorAutocomplete'
import ConfirmacaoOperacionalModal from '@/components/ConfirmacaoOperacionalModal'
import useRealtime from '@/hooks/use-realtime'

export default function EscalaMensal() {
  const now = useMemo(() => new Date(), [])
  const [mes, setMes] = useState<number>(now.getMonth() + 1)
  const [ano, setAno] = useState<number>(now.getFullYear())

  const [escalas, setEscalas] = useState<Escala[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [permanencias, setPermanencias] = useState<Permanencia[]>([])
  const [custodias, setCustodias] = useState<Custodia[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de Feriados
  const [isFeriadoModalOpen, setIsFeriadoModalOpen] = useState(false)
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('')
  const [novoFeriadoData, setNovoFeriadoData] = useState('')
  const [novoFeriadoTipo, setNovoFeriadoTipo] = useState<TipoFeriado>('Nacional')
  const [novoFeriadoRecorrente, setNovoFeriadoRecorrente] = useState(true)
  const [salvandoFeriado, setSalvandoFeriado] = useState(false)

  // Modal de Edição de Dia da Escala
  const [editingDia, setEditingDia] = useState<number | null>(null)
  const [formDelegado, setFormDelegado] = useState<string>('')
  const [formEscrivao, setFormEscrivao] = useState<string>('')
  const [formAgente1, setFormAgente1] = useState<string>('')
  const [formAgente2, setFormAgente2] = useState<string>('')
  const [formAgente3, setFormAgente3] = useState<string>('')
  const [salvandoDia, setSalvandoDia] = useState(false)

  // Modal de confirmação operacional inteligente (Item 5)
  const [modalConfirmacaoOperacionalOpen, setModalConfirmacaoOperacionalOpen] = useState(false)
  const [motivoConfirmacaoOperacional, setMotivoConfirmacaoOperacional] = useState('')
  const [acaoConfirmadaPendente, setAcaoConfirmadaPendente] = useState<
    (() => Promise<void>) | null
  >(null)

  // Alertas de férias no dia selecionado
  const [alertaFeriasConfirmado, setAlertaFeriasConfirmado] = useState(false)

  // Modal de Envio de WhatsApp do Plantão
  const [whatsappDia, setWhatsappDia] = useState<number | null>(null)
  const [whatsappDestinatario, setWhatsappDestinatario] = useState<string>('geral') // 'geral' ou ID do servidor

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [esc, srv, fer, feri, perm, cust] = await Promise.all([
        escalasService.getByMesAno(mes, ano),
        servidoresService.getAll(),
        feriasService.getAll(),
        feriadosService.getAll(),
        permanenciasService.getByMesAno(mes, ano),
        custodiasService.getByMesAno(mes, ano),
      ])
      setEscalas(esc)
      setServidores(srv)
      setFerias(fer)
      setFeriados(feri)
      setPermanencias(perm)
      setCustodias(cust)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar escala mensal.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('escalas', () => carregarDados())
  useRealtime('feriados', () => carregarDados())
  useRealtime('ferias', () => carregarDados())

  // Servidores por Cargo (Ativos)
  const delegados = useMemo(
    () => servidores.filter((s) => s.cargo === 'Delegado' && s.status === 'Ativo'),
    [servidores],
  )
  const escrivaes = useMemo(
    () => servidores.filter((s) => s.cargo === 'Escrivão' && s.status === 'Ativo'),
    [servidores],
  )
  const agentes = useMemo(
    () => servidores.filter((s) => s.cargo === 'Agente/Investigador' && s.status === 'Ativo'),
    [servidores],
  )

  // Helper para verificar se dia é feriado
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

  // Cálculo da quantidade de dias no mês
  const diasNoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate()
  }, [ano, mes])

  // Determina o Tipo de Dia conforme regras do PRD
  const getTipoDia = useCallback(
    (dia: number): TipoDiaEscala => {
      const feriado = getFeriadoDoDia(dia)
      if (feriado) {
        return 'Feriado' // Feriado assume imediatamente regras de fim de semana
      }

      const date = new Date(ano, mes - 1, dia)
      const dayOfWeek = date.getDay() // 0 = Dom, 1 = Seg, ..., 5 = Sex, 6 = Sab

      if (dayOfWeek === 0) return 'Domingo'
      if (dayOfWeek === 6) return 'Sábado'
      if (dayOfWeek === 5) return 'Sexta-Feira'
      return 'Dia Útil'
    },
    [ano, mes, getFeriadoDoDia],
  )

  // Grade completa do mês (dias 1 a N) mesclando com registros do PocketBase
  const gradeMensal = useMemo(() => {
    const list = []
    const escalasMap = new Map<number, Escala>()
    for (const e of escalas) {
      escalasMap.set(e.dia, e)
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const dataObj = new Date(ano, mes - 1, d)
      const tipoDia = getTipoDia(d)
      const feriadoInfo = getFeriadoDoDia(d)
      const escalaExistente = escalasMap.get(d)

      list.push({
        dia: d,
        dataObj,
        tipoDia,
        feriadoInfo,
        escala: escalaExistente,
      })
    }

    return list
  }, [ano, mes, diasNoMes, getTipoDia, getFeriadoDoDia, escalas])

  // Abrir Modal de Edição do Dia
  const handleOpenEditDia = (dia: number) => {
    const item = gradeMensal.find((g) => g.dia === dia)
    const esc = item?.escala

    setEditingDia(dia)
    setFormDelegado(esc?.delegado || '')
    setFormEscrivao(esc?.escrivao || '')
    setFormAgente1(esc?.agente1 || '')
    setFormAgente2(esc?.agente2 || '')
    setFormAgente3(esc?.agente3 || '')
    setAlertaFeriasConfirmado(false)
  }

  // Verificação de alertas de férias para o dia que está sendo editado
  const avisosFeriasNoDia = useMemo(() => {
    if (!editingDia) return []
    const date = new Date(ano, mes - 1, editingDia)
    const avisos: { servidor: Servidor; cargo: string; ferias: Ferias }[] = []

    const testId = (id: string, cargoDesc: string) => {
      if (!id) return
      const f = feriasService.isServidorEmFerias(ferias, id, date)
      if (f) {
        const s = servidores.find((srv) => srv.id === id)
        if (s) {
          avisos.push({ servidor: s, cargo: cargoDesc, ferias: f })
        }
      }
    }

    testId(formDelegado, 'Delegado')
    testId(formEscrivao, 'Escrivão')
    testId(formAgente1, 'Agente 1')
    testId(formAgente2, 'Agente 2')
    testId(formAgente3, 'Agente 3')

    return avisos
  }, [
    editingDia,
    formDelegado,
    formEscrivao,
    formAgente1,
    formAgente2,
    formAgente3,
    ferias,
    servidores,
    ano,
    mes,
  ])

  // Execução final da gravação da escala após eventuais confirmações operacionais
  const executarGravacaoEscala = async () => {
    if (!editingDia) return
    const tipoDia = getTipoDia(editingDia)
    try {
      setSalvandoDia(true)
      await escalasService.upsertDia({
        mes,
        ano,
        dia: editingDia,
        tipo_dia: tipoDia,
        delegado: formDelegado || null,
        escrivao: formEscrivao || null,
        agente1: formAgente1 || null,
        agente2: formAgente2 || null,
        agente3: formAgente3 || null,
      })

      toast.success(
        `Escala do dia ${String(editingDia).padStart(2, '0')}/${String(mes).padStart(2, '0')} salva com sucesso!`,
      )
      setEditingDia(null)
      carregarDados()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar escala do dia.'
      toast.error(msg)
    } finally {
      setSalvandoDia(false)
    }
  }

  // Salvar Dia da Escala com Modais de Confirmação Inteligente para Regras Operacionais (Item 5)
  const handleSaveDia = async () => {
    if (!editingDia) return

    const tipoDia = getTipoDia(editingDia)
    const selecionados = [formDelegado, formEscrivao, formAgente1, formAgente2, formAgente3].filter(
      Boolean,
    ) as string[]

    // 1. Caso: 3º Agente em dia útil (que muda a divisão de horários para a regra de sexta)
    const is3oAgenteDiaUtil = tipoDia === 'Dia Útil' && !!formAgente3

    // 2. Caso: Sobreposição de plantões / servidor escalado em outro papel no mesmo dia
    // (Ex: já escalado na permanência ou na custódia do mesmo dia)
    const permDoDia = permanencias.find((p) => p.dia === editingDia)
    const servsPermanencia = permDoDia ? [permDoDia.agente1, permDoDia.agente2].filter(Boolean) : []

    const custDoDia = custodias.find((c) => c.dia === editingDia)
    const servsCustodia = custDoDia
      ? [custDoDia.agente1, custDoDia.agente2, custDoDia.agente3].filter(Boolean)
      : []

    const conflitoPermanencia = selecionados.filter((id) => servsPermanencia.includes(id))
    const conflitoCustodia = selecionados.filter((id) => servsCustodia.includes(id))

    // 3. Caso: Servidor em Férias
    const temFerias = avisosFeriasNoDia.length > 0 && !alertaFeriasConfirmado

    // Construção das consequências para o modal de confirmação
    const motivos: string[] = []

    if (is3oAgenteDiaUtil) {
      motivos.push(
        'A inclusão do 3º agente em dia útil altera a divisão de horários da equipe: a divisão de horários dos agentes passará a seguir a regra de Sexta-Feira (18h às 08h com revezamento triplo).',
      )
    }

    if (conflitoPermanencia.length > 0) {
      const nomes = conflitoPermanencia
        .map((id) => servidores.find((s) => s.id === id)?.nome || 'Servidor')
        .join(', ')
      motivos.push(
        `O(s) servidor(es) ${nomes} já consta(m) alocado(s) na Escala de Permanência deste mesmo dia.`,
      )
    }

    if (conflitoCustodia.length > 0) {
      const nomes = conflitoCustodia
        .map((id) => servidores.find((s) => s.id === id)?.nome || 'Servidor')
        .join(', ')
      motivos.push(
        `O(s) servidor(es) ${nomes} já consta(m) escalado(s) na Escala de Custódia deste mesmo dia.`,
      )
    }

    if (temFerias) {
      const nomesFerias = avisosFeriasNoDia
        .map(
          (av) =>
            `${av.servidor.nome} (${formatarDataBr(av.ferias.inicio)} a ${formatarDataBr(av.ferias.fim)})`,
        )
        .join('; ')
      motivos.push(`Servidor(es) em período de férias regulamentares: ${nomesFerias}.`)
    }

    // Se houver qualquer uma dessas alterações de regras operacionais, aciona o modal inteligente
    if (motivos.length > 0) {
      setMotivoConfirmacaoOperacional(motivos.join('\n\n'))
      setAcaoConfirmadaPendente(() => executarGravacaoEscala)
      setModalConfirmacaoOperacionalOpen(true)
      return
    }

    await executarGravacaoEscala()
  }

  // Cadastrar Feriado
  const handleCriarFeriado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoFeriadoNome.trim() || !novoFeriadoData) {
      toast.error('Preencha o nome e a data do feriado.')
      return
    }

    try {
      setSalvandoFeriado(true)
      await feriadosService.create({
        nome: novoFeriadoNome.trim(),
        data: `${novoFeriadoData} 00:00:00.000Z`,
        tipo: novoFeriadoTipo,
        recorrente: novoFeriadoRecorrente,
      })

      toast.success('Feriado cadastrado com sucesso! As regras de fim de semana foram aplicadas.')
      setNovoFeriadoNome('')
      setNovoFeriadoData('')
      setIsFeriadoModalOpen(false)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cadastrar feriado.')
    } finally {
      setSalvandoFeriado(false)
    }
  }

  const handleDeleteFeriado = async (id: string) => {
    try {
      await feriadosService.delete(id)
      toast.success('Feriado removido.')
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover feriado.')
    }
  }

  // Helper nome servidor
  const getServidorNome = (id: string | undefined): string => {
    if (!id) return '-'
    return servidores.find((s) => s.id === id)?.nome || '-'
  }

  // Prepara dados de WhatsApp para o dia selecionado
  const getDadosWhatsappDia = useCallback(
    (dia: number) => {
      const item = gradeMensal.find((g) => g.dia === dia)
      if (!item) return null
      const esc = item.escala
      const temAgente3 = !!esc?.agente3
      const horarios = calcularHorariosAgentes(item.tipoDia, temAgente3)

      const findServ = (id?: string) => (id ? servidores.find((s) => s.id === id) : null)

      const delServ = findServ(esc?.delegado)
      const escServ = findServ(esc?.escrivao)
      const ag1Serv = findServ(esc?.agente1)
      const ag2Serv = findServ(esc?.agente2)
      const ag3Serv = findServ(esc?.agente3)

      const diaSemanaNome = item.dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })
      const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`

      const plantonistasList: { servidor: Servidor; cargo: string }[] = []
      if (delServ) plantonistasList.push({ servidor: delServ, cargo: 'Delegado' })
      if (escServ) plantonistasList.push({ servidor: escServ, cargo: 'Escrivão' })
      if (ag1Serv) plantonistasList.push({ servidor: ag1Serv, cargo: 'Agente 1' })
      if (ag2Serv) plantonistasList.push({ servidor: ag2Serv, cargo: 'Agente 2' })
      if (ag3Serv) plantonistasList.push({ servidor: ag3Serv, cargo: 'Agente 3' })

      const mensagem = gerarTextoWhatsappPlantao({
        dataStr: dataFormatada,
        diaSemana: diaSemanaNome,
        delegado: delServ
          ? {
              cargo: 'Delegado',
              nome: delServ.nome,
              telefone: delServ.telefone,
            }
          : null,
        escrivao: escServ
          ? {
              cargo: 'Escrivão',
              nome: escServ.nome,
              telefone: escServ.telefone,
            }
          : null,
        agente1: ag1Serv
          ? {
              cargo: 'Agente 1',
              nome: ag1Serv.nome,
              telefone: ag1Serv.telefone,
              horario: horarios.agente1,
            }
          : null,
        agente2: ag2Serv
          ? {
              cargo: 'Agente 2',
              nome: ag2Serv.nome,
              telefone: ag2Serv.telefone,
              horario: horarios.agente2,
            }
          : null,
        agente3:
          temAgente3 && ag3Serv
            ? {
                cargo: 'Agente 3',
                nome: ag3Serv.nome,
                telefone: ag3Serv.telefone,
                horario: horarios.agente3,
              }
            : null,
      })

      return {
        dia,
        dataFormatada,
        diaSemanaNome,
        plantonistasList,
        mensagem,
      }
    },
    [gradeMensal, servidores, mes, ano],
  )

  const dadosWhatsappAtual = useMemo(() => {
    if (!whatsappDia) return null
    return getDadosWhatsappDia(whatsappDia)
  }, [whatsappDia, getDadosWhatsappDia])

  const handleCopiarMensagemWhatsapp = () => {
    if (!dadosWhatsappAtual) return
    navigator.clipboard.writeText(dadosWhatsappAtual.mensagem)
    toast.success('Mensagem do plantão copiada para a área de transferência!')
  }

  const handleCopiarLinkWhatsapp = () => {
    if (!dadosWhatsappAtual) return
    let url = `https://wa.me/?text=${encodeURIComponent(dadosWhatsappAtual.mensagem)}`
    if (whatsappDestinatario !== 'geral') {
      const plantonista = dadosWhatsappAtual.plantonistasList.find(
        (p) => p.servidor.id === whatsappDestinatario,
      )
      if (plantonista?.servidor.telefone) {
        const num = formatarNumeroWhatsapp(plantonista.servidor.telefone)
        url = `https://wa.me/${num}?text=${encodeURIComponent(dadosWhatsappAtual.mensagem)}`
      }
    }
    navigator.clipboard.writeText(url)
    toast.success('Link do WhatsApp copiado!')
  }

  const handleAbrirWhatsapp = () => {
    if (!dadosWhatsappAtual) return
    let url = `https://wa.me/?text=${encodeURIComponent(dadosWhatsappAtual.mensagem)}`
    if (whatsappDestinatario !== 'geral') {
      const plantonista = dadosWhatsappAtual.plantonistasList.find(
        (p) => p.servidor.id === whatsappDestinatario,
      )
      if (plantonista?.servidor.telefone) {
        const num = formatarNumeroWhatsapp(plantonista.servidor.telefone)
        url = `https://wa.me/${num}?text=${encodeURIComponent(dadosWhatsappAtual.mensagem)}`
      }
    }
    window.open(url, '_blank')
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

  const anosDisponiveis = [2025, 2026, 2027, 2028]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Motor Operacional Policial
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-[#0B2545]" />
            Escala Geral de Plantão Mensal
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Definição automática dos tipos de dia, composição de equipe e divisão horária de 14h ou
            24h.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFeriadoModalOpen(true)}
            className="border-[#C9A227] text-[#0B2545] hover:bg-[#FDF6E3] font-medium"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-[#C9A227]" />
            Gerenciar Feriados ({feriados.length})
          </Button>

          <Button
            variant="outline"
            onClick={carregarDados}
            className="border-[#D1D5DB] text-[#1F2937]"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Barra Seletora de Mês e Ano + Resumo de Regras */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-[#1F2937]">Mês:</Label>
            <Select value={String(mes)} onValueChange={(val) => setMes(parseInt(val, 10))}>
              <SelectTrigger className="w-[150px] h-10 border-[#D1D5DB] font-medium text-[#0B2545]">
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
              <SelectTrigger className="w-[110px] h-10 border-[#D1D5DB] font-medium text-[#0B2545]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge
            variant="outline"
            className="text-xs text-[#0B2545] border-[#0B2545]/30 bg-blue-50/50 py-1"
          >
            Total de {diasNoMes} dias em {mesesNomes[mes - 1]}/{ano}
          </Badge>
        </div>

        {/* Legenda de Badges por tipo de dia */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-semibold text-[#6B7280]">Legenda:</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
            Dia Útil (14h)
          </span>
          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
            Sexta (14h / 3 Agentes)
          </span>
          <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
            FDS (24h)
          </span>
          <span className="bg-[#FDF6E3] text-[#C9A227] px-2 py-0.5 rounded border border-[#C9A227] font-semibold">
            Feriado (24h)
          </span>
        </div>
      </div>

      {/* Grade Mensal Automática */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E9F0] text-[#0B2545] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-16 text-center">Data</th>
                <th className="py-3 px-3 w-28">Dia / Tipo</th>
                <th className="py-3 px-3">Delegado</th>
                <th className="py-3 px-3">Escrivão</th>
                <th className="py-3 px-3">Agentes Operacionais</th>
                <th className="py-3 px-3">Horários Previstos</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#6B7280]">
                    Carregando grade operacional do mês...
                  </td>
                </tr>
              ) : (
                gradeMensal.map((item) => {
                  const d = item.dia
                  const diaSemana = item.dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })
                  const esc = item.escala
                  const temAgente3 = !!esc?.agente3
                  const horarios = calcularHorariosAgentes(item.tipoDia, temAgente3)

                  // Verificar se tem algum servidor de férias escalado nesse dia
                  const hasFeriasAlert = (() => {
                    if (!esc) return false
                    const ids = [
                      esc.delegado,
                      esc.escrivao,
                      esc.agente1,
                      esc.agente2,
                      esc.agente3,
                    ].filter(Boolean)
                    for (const id of ids) {
                      if (feriasService.isServidorEmFerias(ferias, id!, item.dataObj)) {
                        return true
                      }
                    }
                    return false
                  })()

                  const isFeriado = item.tipoDia === 'Feriado'
                  const isFds = item.tipoDia === 'Sábado' || item.tipoDia === 'Domingo'
                  const isSexta = item.tipoDia === 'Sexta-Feira'

                  return (
                    <tr
                      key={d}
                      className={`hover:bg-[#F5F7FA] transition-colors ${
                        hasFeriasAlert
                          ? 'bg-[#FDF3E7]'
                          : isFeriado
                            ? 'bg-[#FFFDF5]'
                            : isFds
                              ? 'bg-[#F8FAFC]'
                              : d % 2 === 1
                                ? 'bg-white'
                                : 'bg-[#F9FAFB]'
                      }`}
                    >
                      {/* Data */}
                      <td className="py-2.5 px-3 text-center font-bold text-sm text-[#0B2545]">
                        <span className="block">{String(d).padStart(2, '0')}</span>
                        <span className="text-[10px] text-[#6B7280] font-normal uppercase">
                          {diaSemana}
                        </span>
                      </td>

                      {/* Tipo de Dia */}
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isFeriado
                              ? 'bg-[#FDF6E3] text-[#C9A227] border-[#C9A227]'
                              : isSexta
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : isFds
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {item.tipoDia}
                        </Badge>
                        {item.feriadoInfo && (
                          <p
                            className="text-[10px] text-[#C9A227] font-medium mt-0.5 truncate max-w-[140px]"
                            title={item.feriadoInfo.nome}
                          >
                            ★ {item.feriadoInfo.nome}
                          </p>
                        )}
                        {hasFeriasAlert && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#D97706] font-bold mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                            Férias
                          </span>
                        )}
                      </td>

                      {/* Delegado */}
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-[#1F2937]">
                          {getServidorNome(esc?.delegado)}
                        </span>
                      </td>

                      {/* Escrivão */}
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-[#1F2937]">
                          {getServidorNome(esc?.escrivao)}
                        </span>
                      </td>

                      {/* Agentes */}
                      <td className="py-2.5 px-3">
                        {esc ? (
                          <div className="space-y-0.5">
                            <p className="text-[#1F2937]">
                              <strong>1:</strong> {getServidorNome(esc.agente1)}
                            </p>
                            <p className="text-[#1F2937]">
                              <strong>2:</strong> {getServidorNome(esc.agente2)}
                            </p>
                            {esc.agente3 && (
                              <p className="text-[#0B2545] font-semibold">
                                <strong>3:</strong> {getServidorNome(esc.agente3)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6B7280] italic">Não preenchido</span>
                        )}
                      </td>

                      {/* Horários Calculados */}
                      <td className="py-2.5 px-3">
                        <div className="text-[10px] space-y-0.5 font-mono">
                          <p className="font-semibold text-[#0B2545] font-sans">
                            {horarios.plantaoDesc}
                          </p>
                          <p className="text-[#6B7280]">
                            Ag1: <span className="text-[#1F2937]">{horarios.agente1}</span>
                          </p>
                          <p className="text-[#6B7280]">
                            Ag2: <span className="text-[#1F2937]">{horarios.agente2}</span>
                          </p>
                          {horarios.agente3 && (
                            <p className="text-[#6B7280]">
                              Ag3: <span className="text-[#1F2937]">{horarios.agente3}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setWhatsappDia(d)
                              setWhatsappDestinatario('geral')
                            }}
                            className="h-8 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-1"
                            title="Enviar escala do dia via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDia(d)}
                            className="h-8 text-xs border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white transition-colors"
                          >
                            {esc ? 'Editar' : 'Escalar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edição do Dia da Escala */}
      <Dialog open={editingDia !== null} onOpenChange={(open) => !open && setEditingDia(null)}>
        <DialogContent className="max-w-xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0B2545]" />
              Escala de Plantão — Dia {String(editingDia).padStart(2, '0')}/
              {String(mes).padStart(2, '0')}/{ano}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Tipo de plantão calculado: <strong>{editingDia ? getTipoDia(editingDia) : ''}</strong>
              {editingDia && getFeriadoDoDia(editingDia) && (
                <span className="text-[#C9A227] font-semibold block">
                  ★ Feriado: {getFeriadoDoDia(editingDia)?.nome} (Regra 24h aplicada
                  automaticamente)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Alerta de Férias Prescritivo do PRD */}
          {avisosFeriasNoDia.length > 0 && (
            <div className="bg-[#FDF3E7] border-2 border-[#D97706] rounded-lg p-3 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-[#0B2545] font-bold">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                ALERTA DE FÉRIAS REGULAMENTARES
              </div>
              <p className="text-[#1F2937]">
                Os seguintes servidores selecionados estão em{' '}
                <strong>período de férias regulamentares</strong> nesta data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#1F2937]">
                {avisosFeriasNoDia.map((av, idx) => (
                  <li key={idx}>
                    <strong>{av.cargo}:</strong> {av.servidor.nome} (Férias de{' '}
                    {formatarDataBr(av.ferias.inicio)} a {formatarDataBr(av.ferias.fim)})
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 pt-1 font-semibold text-[#0B2545] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertaFeriasConfirmado}
                  onChange={(e) => setAlertaFeriasConfirmado(e.target.checked)}
                  className="rounded border-[#D97706] text-[#0B2545] focus:ring-[#0B2545]"
                />
                Confirmar escalação extraordinária deste(s) servidor(es) mesmo em férias
              </label>
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* Delegado com Autocomplete Universal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2937]">
                01 Delegado de Polícia *
              </Label>
              <ServidorAutocomplete
                servidores={delegados}
                value={formDelegado}
                onChange={setFormDelegado}
                placeholder="Buscar delegado por nome ou matrícula..."
                filtroCargo="Delegado"
              />
            </div>

            {/* Escrivão com Autocomplete Universal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2937]">
                01 Escrivão de Polícia *
              </Label>
              <ServidorAutocomplete
                servidores={escrivaes}
                value={formEscrivao}
                onChange={setFormEscrivao}
                placeholder="Buscar escrivão por nome ou matrícula..."
                filtroCargo="Escrivão"
              />
            </div>

            {/* Agentes 1 e 2 com Autocomplete Universal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Agente / Investigador 1 *
                </Label>
                <ServidorAutocomplete
                  servidores={agentes}
                  value={formAgente1}
                  onChange={setFormAgente1}
                  placeholder="Buscar agente 1..."
                  filtroCargo="Agente/Investigador"
                  disabledIds={[formAgente2, formAgente3].filter(Boolean)}
                  disabledMessage="Já selecionado nesta equipe"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Agente / Investigador 2 *
                </Label>
                <ServidorAutocomplete
                  servidores={agentes}
                  value={formAgente2}
                  onChange={setFormAgente2}
                  placeholder="Buscar agente 2..."
                  filtroCargo="Agente/Investigador"
                  disabledIds={[formAgente1, formAgente3].filter(Boolean)}
                  disabledMessage="Já selecionado nesta equipe"
                />
              </div>
            </div>

            {/* 3º Agente com Autocomplete Universal */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Agente / Investigador 3 (Opcional / Padrão em Sex, FDS e Feriados)
                </Label>
                {formAgente3 && (
                  <Button
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
              <p className="text-[11px] text-[#6B7280]">
                {editingDia && getTipoDia(editingDia) === 'Dia Útil'
                  ? '💡 Regra Flexível: Ao adicionar um 3º agente em dia útil, a divisão dos horários passará a seguir a regra de Sexta-Feira com confirmação.'
                  : 'Em Sextas, Sábados, Domingos e Feriados a composição padrão é tripla.'}
              </p>
            </div>

            {/* Box explicativo dos horários que serão aplicados */}
            {editingDia && (
              <div className="bg-[#F5F7FA] border border-[#E5E9F0] rounded-lg p-3 text-xs">
                <span className="font-semibold text-[#0B2545] block">Horários Resultantes:</span>
                {(() => {
                  const h = calcularHorariosAgentes(getTipoDia(editingDia), !!formAgente3)
                  return (
                    <div className="font-mono text-[11px] mt-1 space-y-0.5">
                      <p className="text-[#0B2545] font-sans font-medium">{h.plantaoDesc}</p>
                      <p>Agente 1: {h.agente1}</p>
                      <p>Agente 2: {h.agente2}</p>
                      {h.agente3 && <p>Agente 3: {h.agente3}</p>}
                    </div>
                  )
                })()}
              </div>
            )}
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
              onClick={handleSaveDia}
              disabled={salvandoDia}
              className="bg-[#0B2545] hover:bg-[#081A33] text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {salvandoDia ? 'Salvando...' : 'Salvar Escala do Dia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação Inteligente para Alteração de Regras Operacionais (Item 5) */}
      <ConfirmacaoOperacionalModal
        open={modalConfirmacaoOperacionalOpen}
        onOpenChange={setModalConfirmacaoOperacionalOpen}
        onConfirm={() => {
          if (acaoConfirmadaPendente) {
            acaoConfirmadaPendente()
            setAcaoConfirmadaPendente(null)
          }
        }}
        title="Você realmente confirma essa inclusão/alteração fora do padrão?"
        consequencia={motivoConfirmacaoOperacional}
        confirmText="Sim, confirmar"
        cancelText="Cancelar"
      />

      {/* Modal WhatsApp do Plantão */}
      <Dialog open={whatsappDia !== null} onOpenChange={(open) => !open && setWhatsappDia(null)}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Enviar Escala do Plantão via WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Dia {dadosWhatsappAtual?.dataFormatada} ({dadosWhatsappAtual?.diaSemanaNome})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Opções de Envio: Destinatário */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2937]">
                Destinatário da Mensagem:
              </Label>
              <Select value={whatsappDestinatario} onValueChange={setWhatsappDestinatario}>
                <SelectTrigger className="h-10 border-[#D1D5DB] text-xs">
                  <SelectValue placeholder="Selecione o destinatário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">
                    Sem destinatário fixo (Link geral para Grupos Operacionais)
                  </SelectItem>
                  {dadosWhatsappAtual?.plantonistasList.map((p) => (
                    <SelectItem key={p.servidor.id} value={p.servidor.id}>
                      {p.cargo}: {p.servidor.nome} — Tel: {formatarTelefone(p.servidor.telefone)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#6B7280]">
                {whatsappDestinatario === 'geral'
                  ? 'Gera o link universal wa.me/?text=... para você compartilhar em qualquer grupo de WhatsApp.'
                  : 'Abre conversa direta com o plantonista selecionado com a mensagem pré-formatada.'}
              </p>
            </div>

            {/* Pré-visualização da Mensagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Mensagem Formatada (Padrão Oficial):
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopiarMensagemWhatsapp}
                  className="h-6 text-[11px] text-[#0B2545] hover:bg-[#F5F7FA] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar texto
                </Button>
              </div>
              <pre className="p-3 bg-[#F5F7FA] border border-[#E5E9F0] rounded-lg text-xs font-mono text-[#1F2937] whitespace-pre-wrap select-all leading-relaxed">
                {dadosWhatsappAtual?.mensagem}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-[#E5E9F0]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarLinkWhatsapp}
              className="text-xs border-[#D1D5DB] flex items-center gap-1.5 w-full sm:w-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar Link wa.me
            </Button>
            <Button
              type="button"
              onClick={handleAbrirWhatsapp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 w-full sm:w-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir WhatsApp Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Gestor de Feriados */}
      <Dialog open={isFeriadoModalOpen} onOpenChange={setIsFeriadoModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C9A227]" />
              Gestor de Feriados (Nacionais, Estaduais e Municipais)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Ao cadastrar um feriado, o dia marcado assume imediatamente as regras de{' '}
              <strong>Finais de Semana (Plantão de 24h)</strong> na grade mensal.
            </DialogDescription>
          </DialogHeader>

          {/* Formulário de Novo Feriado */}
          <form
            onSubmit={handleCriarFeriado}
            className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E5E9F0] space-y-3"
          >
            <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
              Cadastrar Novo Feriado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2937]">Nome do Feriado *</Label>
                <Input
                  placeholder="Ex.: Emancipação Política"
                  value={novoFeriadoNome}
                  onChange={(e) => setNovoFeriadoNome(e.target.value)}
                  className="h-9 border-[#D1D5DB] text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2937]">Data do Feriado *</Label>
                <Input
                  type="date"
                  value={novoFeriadoData}
                  onChange={(e) => setNovoFeriadoData(e.target.value)}
                  className="h-9 border-[#D1D5DB] text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2937]">Âmbito / Tipo</Label>
                <Select
                  value={novoFeriadoTipo}
                  onValueChange={(val) => setNovoFeriadoTipo(val as TipoFeriado)}
                >
                  <SelectTrigger className="h-9 border-[#D1D5DB] text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nacional">Nacional</SelectItem>
                    <SelectItem value="Estadual">Estadual</SelectItem>
                    <SelectItem value="Municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[#1F2937] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoFeriadoRecorrente}
                    onChange={(e) => setNovoFeriadoRecorrente(e.target.checked)}
                    className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                  />
                  <span>Recorrente (repete anualmente)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={salvandoFeriado}
                size="sm"
                className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {salvandoFeriado ? 'Adicionando...' : 'Adicionar Feriado'}
              </Button>
            </div>
          </form>

          {/* Lista de Feriados Cadastrados */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
              Feriados Registrados ({feriados.length})
            </h3>
            <div className="border border-[#E5E9F0] rounded-lg divide-y divide-[#E5E9F0] max-h-60 overflow-y-auto">
              {feriados.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#6B7280]">
                  Nenhum feriado cadastrado.
                </div>
              ) : (
                feriados.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-[#F5F7FA]"
                  >
                    <div>
                      <p className="font-semibold text-[#0B2545]">{f.nome}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                        <span>Data: {formatarDataBr(f.data)}</span>
                        <span>•</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1 border-amber-300 text-amber-900 bg-amber-50"
                        >
                          {f.tipo}
                        </Badge>
                        {f.recorrente && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Anual
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFeriado(f.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      title="Excluir Feriado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => setIsFeriadoModalOpen(false)}
              className="bg-[#0B2545] text-white"
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
