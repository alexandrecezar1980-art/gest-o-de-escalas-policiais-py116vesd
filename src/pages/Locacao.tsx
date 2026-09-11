import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
  Layers,
  Printer,
  X,
  AlertTriangle,
} from 'lucide-react'
import BrasaoPCPB from '@/components/BrasaoPCPB'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { unidadesService, servidoresService } from '@/services/policeServices'
import type { Unidade, Servidor } from '@/types/police'
import { getUnidadeEscrivaes, getUnidadeAgentes } from '@/types/police'
import ServidorAutocomplete from '@/components/ServidorAutocomplete'
import ConfirmacaoOperacionalModal from '@/components/ConfirmacaoOperacionalModal'
import useRealtime from '@/hooks/use-realtime'

export default function Locacao() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formDelegado, setFormDelegado] = useState('')
  const [formEscrivaes, setFormEscrivaes] = useState<string[]>([])
  const [formAgentes, setFormAgentes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Autocomplete auxiliar temporário para adicionar novos Escrivães ou Agentes
  const [novoEscrivaoId, setNovoEscrivaoId] = useState('')
  const [novoAgenteId, setNovoAgenteId] = useState('')

  // Modal de Confirmação para quando exceder a quantidade padrão recomendada (Item 3)
  const [modalConfirmacaoExcessoOpen, setModalConfirmacaoExcessoOpen] = useState(false)
  const [acaoConfirmacaoPendente, setAcaoConfirmacaoPendente] = useState<(() => void) | null>(null)
  const [motivoConfirmacao, setMotivoConfirmacao] = useState('')

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [u, s] = await Promise.all([unidadesService.getAll(), servidoresService.getAll()])
      setUnidades(u)
      setServidores(s)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados de lotação.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('unidades', () => carregarDados())
  useRealtime('servidores', () => carregarDados())

  // Servidores já lotados em outras unidades:
  // NOTA: Conforme PRD item 3: "Delegados Multi-Unidade: permitir que o MESMO Delegado seja alocado em mais de uma delegacia/unidade (remover a trava que impede delegado duplicado entre unidades)."
  // Portanto, NÃO bloqueamos delegados! Apenas avisamos caso queira.
  // Para Escrivães e Agentes, mantemos a indicação de lotação.
  const servidoresLotadosEmOutras = useMemo(() => {
    const map = new Map<string, string[]>() // servidorId -> lista de nomes de unidades
    for (const u of unidades) {
      if (editingId && u.id === editingId) continue // ignora a unidade em edição

      const registrar = (id?: string | null) => {
        if (!id) return
        const list = map.get(id) || []
        list.push(u.nome)
        map.set(id, list)
      }

      registrar(u.delegado)
      for (const escId of getUnidadeEscrivaes(u)) {
        registrar(escId)
      }
      for (const agId of getUnidadeAgentes(u)) {
        registrar(agId)
      }
    }
    return map
  }, [unidades, editingId])

  // Listas de servidores por cargo (suportando multifunção / cargos secundários)
  const delegadosDisponiveis = useMemo(() => {
    return servidores.filter(
      (s) =>
        (s.cargo === 'Delegado' ||
          (Array.isArray(s.cargos_secundarios) && s.cargos_secundarios.includes('Delegado'))) &&
        s.status === 'Ativo',
    )
  }, [servidores])

  const escrivaesDisponiveis = useMemo(() => {
    return servidores.filter(
      (s) =>
        (s.cargo === 'Escrivão' ||
          (Array.isArray(s.cargos_secundarios) && s.cargos_secundarios.includes('Escrivão'))) &&
        s.status === 'Ativo',
    )
  }, [servidores])

  const agentesDisponiveis = useMemo(() => {
    return servidores.filter(
      (s) =>
        (s.cargo === 'Agente/Investigador' ||
          (Array.isArray(s.cargos_secundarios) &&
            s.cargos_secundarios.includes('Agente/Investigador'))) &&
        s.status === 'Ativo',
    )
  }, [servidores])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormNome('')
    setFormDelegado('')
    setFormEscrivaes([])
    setFormAgentes([])
    setNovoEscrivaoId('')
    setNovoAgenteId('')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (u: Unidade) => {
    setEditingId(u.id)
    setFormNome(u.nome)
    setFormDelegado(u.delegado || '')
    setFormEscrivaes(getUnidadeEscrivaes(u))
    setFormAgentes(getUnidadeAgentes(u))
    setNovoEscrivaoId('')
    setNovoAgenteId('')
    setFormError('')
    setIsModalOpen(true)
  }

  // Adicionar escrivão com confirmação se > 2 (Item 3)
  const handleAdicionarEscrivao = (id: string) => {
    if (!id) return
    if (formEscrivaes.includes(id)) {
      toast.info('Este escrivão já está adicionado nesta unidade.')
      return
    }

    const operacao = () => {
      setFormEscrivaes((prev) => [...prev, id])
      setNovoEscrivaoId('')
      toast.success('Escrivão adicionado à unidade.')
    }

    // Se já tiver 2 ou mais escrivães (limite padrão recomendado)
    if (formEscrivaes.length >= 2) {
      setMotivoConfirmacao(
        `A unidade passará a ter ${formEscrivaes.length + 1} escrivães (padrão recomendado: 02).`,
      )
      setAcaoConfirmacaoPendente(() => operacao)
      setModalConfirmacaoExcessoOpen(true)
    } else {
      operacao()
    }
  }

  const handleRemoverEscrivao = (id: string) => {
    setFormEscrivaes((prev) => prev.filter((x) => x !== id))
  }

  // Adicionar agente com confirmação se > 8 (Item 3)
  const handleAdicionarAgente = (id: string) => {
    if (!id) return
    if (formAgentes.includes(id)) {
      toast.info('Este agente já está adicionado nesta unidade.')
      return
    }

    const operacao = () => {
      setFormAgentes((prev) => [...prev, id])
      setNovoAgenteId('')
      toast.success('Agente/Investigador adicionado à unidade.')
    }

    // Se já tiver 8 ou mais agentes (limite padrão recomendado)
    if (formAgentes.length >= 8) {
      setMotivoConfirmacao(
        `A unidade passará a ter ${formAgentes.length + 1} agentes (padrão recomendado: 08).`,
      )
      setAcaoConfirmacaoPendente(() => operacao)
      setModalConfirmacaoExcessoOpen(true)
    } else {
      operacao()
    }
  }

  const handleRemoverAgente = (id: string) => {
    setFormAgentes((prev) => prev.filter((x) => x !== id))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formNome.trim()) {
      setFormError('O nome da Delegacia/Unidade é obrigatório.')
      return
    }
    if (!formDelegado) {
      setFormError('Selecione 01 Delegado Responsável.')
      return
    }

    const payload: Partial<Unidade> = {
      nome: formNome.trim(),
      delegado: formDelegado,
      escrivaes: formEscrivaes,
      agentes: formAgentes,
      // Retrocompatibilidade com campos legados
      escrivao1: formEscrivaes[0] || null,
      escrivao2: formEscrivaes[1] || null,
      agente1: formAgentes[0] || null,
      agente2: formAgentes[1] || null,
      agente3: formAgentes[2] || null,
      agente4: formAgentes[3] || null,
      agente5: formAgentes[4] || null,
      agente6: formAgentes[5] || null,
      agente7: formAgentes[6] || null,
      agente8: formAgentes[7] || null,
    }

    try {
      setSaving(true)
      if (editingId) {
        await unidadesService.update(editingId, payload)
        toast.success('Lotação da Unidade atualizada com sucesso!')
      } else {
        await unidadesService.create(payload)
        toast.success('Unidade cadastrada com sucesso!')
      }
      setIsModalOpen(false)
      carregarDados()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar unidade.'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await unidadesService.delete(deleteId)
      toast.success('Unidade removida com sucesso!')
      setDeleteId(null)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover unidade.')
    } finally {
      setDeleting(false)
    }
  }

  // Helper para buscar nome do servidor por ID
  const getNome = (id: string | undefined): string => {
    if (!id) return ''
    return servidores.find((s) => s.id === id)?.nome || 'Servidor'
  }

  const getServidor = (id: string | undefined): Servidor | undefined => {
    if (!id) return undefined
    return servidores.find((s) => s.id === id)
  }

  // Tabela Consolidada: qual Delegacia cada servidor trabalha
  const tabelaConsolidada = useMemo(() => {
    return servidores
      .map((s) => {
        // Encontrar todas as unidades em que o servidor está lotado (delegados multi-unidade!)
        const unds = unidades.filter((u) => {
          if (u.delegado === s.id) return true
          if (getUnidadeEscrivaes(u).includes(s.id)) return true
          if (getUnidadeAgentes(u).includes(s.id)) return true
          return false
        })

        return {
          servidor: s,
          unidades: unds,
          unidadeNome:
            unds.length > 0 ? unds.map((u) => u.nome).join(', ') : 'Sem lotação definida',
          isLotado: unds.length > 0,
        }
      })
      .sort((a, b) => {
        if (a.isLotado && !b.isLotado) return -1
        if (!a.isLotado && b.isLotado) return 1
        return a.servidor.nome.localeCompare(b.servidor.nome)
      })
  }, [servidores, unidades])

  const handleImprimirExpediente = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header (Não imprime) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Expediente e Estrutura
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0B2545]" />
            Lotação das Unidades Policiais (Expediente)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Cadastre as Delegacias/Unidades e vincule o efetivo com busca inteligente. Delegados
            podem ser multi-unidade e o quantitativo é flexível.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleImprimirExpediente}
            variant="outline"
            className="border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA] font-medium shadow-sm text-xs h-9 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-[#0B2545]" />
            Imprimir Expediente (A4)
          </Button>

          <a
            href="/database_dump.sql"
            download="database_dump.sql"
            className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-sm transition-colors"
            title="Baixar dump completo ANSI SQL / PostgreSQL do banco"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Exportar Banco (SQL)
          </a>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white font-medium shadow-sm text-xs h-9 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Grid de Unidades Cadastradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-sm text-[#6B7280] bg-white rounded-xl border border-[#E5E9F0]">
            Carregando lotações...
          </div>
        ) : unidades.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-[#6B7280] bg-white rounded-xl border border-[#E5E9F0]">
            Nenhuma unidade policial cadastrada. Clique em "Nova Unidade" para começar.
          </div>
        ) : (
          unidades.map((u) => {
            const escrivaesList = getUnidadeEscrivaes(u)
            const agentesList = getUnidadeAgentes(u)

            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm p-5 flex flex-col justify-between hover:border-[#0B2545]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E9F0]">
                    <div>
                      <h3 className="font-bold text-[#0B2545] text-base leading-tight">{u.nome}</h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Efetivo: 1 Delegado • {escrivaesList.length} Escrivão(ães) •{' '}
                        {agentesList.length} Agente(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="h-8 w-8 p-0 text-[#0B2545] hover:bg-[#D6E4F0]"
                        title="Editar Unidade"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(u.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        title="Excluir Unidade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Detalhe dos servidores lotados */}
                  <div className="space-y-3 pt-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] block">
                        Delegado(a) Titular / Responsável:
                      </span>
                      <p className="font-semibold text-[#0B2545] mt-0.5 flex items-center gap-1.5">
                        <BrasaoPCPB className="w-3.5 h-auto" />
                        {getNome(u.delegado) || 'Não definido'}
                        {u.delegado && servidoresLotadosEmOutras.get(u.delegado)?.length ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 border-blue-300 bg-blue-50 text-blue-700 ml-1 font-normal"
                            title={`Lotado também em: ${servidoresLotadosEmOutras.get(u.delegado)?.join(', ')}`}
                          >
                            Multi-Unidade ({servidoresLotadosEmOutras.get(u.delegado)!.length + 1})
                          </Badge>
                        ) : null}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] block">
                          Escrivães ({escrivaesList.length}):
                        </span>
                        {escrivaesList.length > 2 && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Acima do padrão
                          </span>
                        )}
                      </div>
                      {escrivaesList.length === 0 ? (
                        <p className="text-[#6B7280] italic">Nenhum escrivão vinculado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {escrivaesList.map((id) => (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="text-xs bg-blue-50 text-[#1D4E89] border border-blue-200"
                            >
                              {getNome(id)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] block">
                          Agentes / Investigadores ({agentesList.length}):
                        </span>
                        {agentesList.length > 8 && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Acima do padrão
                          </span>
                        )}
                      </div>
                      {agentesList.length === 0 ? (
                        <p className="text-[#6B7280] italic">Nenhum agente vinculado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {agentesList.map((id) => (
                            <Badge
                              key={id}
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-800 border-gray-300"
                            >
                              {getNome(id)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>{' '}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E9F0] text-[11px] text-[#6B7280] flex justify-between items-center">
                  <span>
                    Capacidade preenchida: {1 + escrivaesList.length + agentesList.length}{' '}
                    servidores
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50"
                  >
                    Operacional
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Tabela Consolidada: Onde cada servidor trabalha */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E9F0] bg-[#F5F7FA]">
          <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0B2545]" />
            Tabela Consolidada de Lotação (Servidor → Delegacia)
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Exibição clara de em qual Delegacia/Unidade cada servidor policial está oficialmente
            alocado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white border-b border-[#E5E9F0] text-[#0B2545] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Servidor Policial</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4">Telefone / Contato</th>
                <th className="py-3 px-4">Lotação Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {tabelaConsolidada.map((item, idx) => (
                <tr
                  key={item.servidor.id}
                  className={`hover:bg-[#F5F7FA] transition-colors ${
                    idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-[#1F2937]">{item.servidor.nome}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">
                      {item.servidor.cargo}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6B7280]">
                    {item.servidor.telefone}
                  </td>
                  <td className="py-3 px-4">
                    {item.isLotado ? (
                      <span className="font-semibold text-[#0B2545] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-xs inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0B2545]" />
                        {item.unidadeNome}
                      </span>
                    ) : (
                      <span className="text-[#6B7280] italic text-xs">Não lotado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição de Unidade com Autocomplete e Quantitativo Flexível */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0B2545]" />
              {editingId ? 'Editar Lotação da Unidade' : 'Cadastrar Nova Unidade'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Configure o efetivo da Delegacia/Unidade. Delegados podem acumular unidades e o
              quantitativo de escrivães e agentes é flexível mediante confirmação.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            {/* Nome da Unidade */}
            <div className="space-y-1.5">
              <Label htmlFor="unidadeNome" className="text-xs font-semibold text-[#1F2937]">
                Nome da Delegacia / Unidade Policial *
              </Label>
              <Input
                id="unidadeNome"
                placeholder="Ex.: 1ª Delegacia Distrital, DEAM, GTE..."
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="h-10 border-[#D1D5DB] text-xs"
                required
              />
            </div>

            {/* Delegado Responsável (Multi-unidade permitido!) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  01 Delegado(a) Titular / Responsável *
                </Label>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Delegados multi-unidade permitidos
                </span>
              </div>
              <ServidorAutocomplete
                servidores={delegadosDisponiveis}
                value={formDelegado}
                onChange={setFormDelegado}
                placeholder="Buscar delegado por nome ou matrícula..."
                labelVazio="Selecione o delegado responsável..."
                filtroCargo="Delegado"
                warningIds={delegadosDisponiveis
                  .filter((d) => servidoresLotadosEmOutras.has(d.id))
                  .map((d) => ({
                    id: d.id,
                    motivo: `Também lotado em: ${servidoresLotadosEmOutras.get(d.id)?.join(', ')}`,
                  }))}
              />
            </div>

            {/* Escrivães com Autocomplete + lista de alocados */}
            <div className="space-y-2 pt-2 border-t border-[#E5E9F0]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Escrivães de Polícia ({formEscrivaes.length})
                </Label>
                <span className="text-[11px] text-[#6B7280]">
                  Padrão recomendado: até 02 Escrivães
                </span>
              </div>

              {/* Seletor Autocomplete para adicionar escrivão */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ServidorAutocomplete
                    servidores={escrivaesDisponiveis}
                    value={novoEscrivaoId}
                    onChange={(id) => {
                      setNovoEscrivaoId(id)
                      if (id) handleAdicionarEscrivao(id)
                    }}
                    placeholder="Adicionar Escrivão por nome, matrícula..."
                    filtroCargo="Escrivão"
                    disabledIds={formEscrivaes}
                    disabledMessage="Já adicionado nesta unidade"
                  />
                </div>
              </div>

              {/* Chips / Badges de Escrivães Adicionados */}
              <div className="border border-[#D1D5DB] rounded-lg p-2.5 min-h-16 bg-[#F9FAFB] space-y-1.5">
                {formEscrivaes.length === 0 ? (
                  <p className="text-[#9CA3AF] italic text-xs py-1">
                    Nenhum escrivão vinculado. Use o campo acima para buscar e adicionar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formEscrivaes.map((id, idx) => {
                      const s = getServidor(id)
                      const isAcima = idx >= 2
                      return (
                        <div
                          key={id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                            isAcima
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-blue-50 text-[#1D4E89] border-blue-200'
                          }`}
                        >
                          <span className="font-medium">{s?.nome || id}</span>
                          {s?.matricula && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              ({s.matricula})
                            </span>
                          )}
                          {isAcima && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">
                              Extra
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoverEscrivao(id)}
                            className="hover:bg-red-100 hover:text-red-700 rounded p-0.5 ml-1 transition-colors"
                            title="Remover escrivão"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Agentes / Investigadores com Autocomplete + lista de alocados */}
            <div className="space-y-2 pt-2 border-t border-[#E5E9F0]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1F2937]">
                  Agentes / Investigadores ({formAgentes.length})
                </Label>
                <span className="text-[11px] text-[#6B7280]">
                  Padrão recomendado: até 08 Agentes
                </span>
              </div>

              {/* Seletor Autocomplete para adicionar agente */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ServidorAutocomplete
                    servidores={agentesDisponiveis}
                    value={novoAgenteId}
                    onChange={(id) => {
                      setNovoAgenteId(id)
                      if (id) handleAdicionarAgente(id)
                    }}
                    placeholder="Adicionar Agente/Investigador por nome, matrícula..."
                    filtroCargo="Agente/Investigador"
                    disabledIds={formAgentes}
                    disabledMessage="Já adicionado nesta unidade"
                  />
                </div>
              </div>

              {/* Chips / Badges de Agentes Adicionados */}
              <div className="border border-[#D1D5DB] rounded-lg p-2.5 min-h-20 bg-[#F9FAFB] space-y-1.5">
                {formAgentes.length === 0 ? (
                  <p className="text-[#9CA3AF] italic text-xs py-1">
                    Nenhum agente vinculado. Use o campo acima para buscar e adicionar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formAgentes.map((id, idx) => {
                      const s = getServidor(id)
                      const isAcima = idx >= 8
                      return (
                        <div
                          key={id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                            isAcima
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-white text-gray-800 border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{s?.nome || id}</span>
                          {s?.matricula && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              ({s.matricula})
                            </span>
                          )}
                          {isAcima && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">
                              Extra
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoverAgente(id)}
                            className="hover:bg-red-100 hover:text-red-700 rounded p-0.5 ml-1 transition-colors"
                            title="Remover agente"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#E5E9F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#D1D5DB] text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar Unidade' : 'Cadastrar Unidade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação quando exceder limites padrão (Item 3 do PRD: "Atenção: Esta unidade já atingiu a quantidade padrão recomendada...") */}
      <ConfirmacaoOperacionalModal
        open={modalConfirmacaoExcessoOpen}
        onOpenChange={setModalConfirmacaoExcessoOpen}
        onConfirm={() => {
          if (acaoConfirmacaoPendente) {
            acaoConfirmacaoPendente()
            setAcaoConfirmacaoPendente(null)
          }
        }}
        title="Atenção: Esta unidade já atingiu a quantidade padrão recomendada. Você realmente deseja inserir mais um servidor?"
        consequencia={motivoConfirmacao}
        confirmText="Sim, adicionar"
        cancelText="Cancelar"
      />

      {/* ÁREA DE IMPRESSÃO LIMPA DO EXPEDIENTE (A4 — Item 3) */}
      <div className="hidden print:block print:p-0 print:border-none print:shadow-none bg-white">
        {/* Cabeçalho Oficial PCPB */}
        <div className="border-b-2 border-[#0B2545] pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <BrasaoPCPB className="h-16 w-auto max-w-[64px]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0B2545] tracking-wider uppercase">
                POLÍCIA CIVIL DO ESTADO DA PARAÍBA
              </p>
              <h2 className="text-base font-bold text-[#0B2545] uppercase tracking-wide leading-tight">
                20ª DELEGACIA SECCIONAL DE POLÍCIA CIVIL
              </h2>
              <p className="text-xs font-semibold text-[#1F2937]">
                QUADRO GERAL DE LOTAÇÃO E EXPEDIENTE DAS UNIDADES
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Relação consolidada de delegacias e seus efetivos policiais vinculados.
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-[#6B7280]">
            <p className="font-semibold text-[#0B2545]">Documento de Expediente</p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Tabela de Unidades e seus Efetivos formatada para folha A4 */}
        <div className="space-y-4">
          <table className="w-full border-collapse text-[10px] border border-[#0B2545]">
            <thead>
              <tr className="bg-[#0B2545] text-white">
                <th className="py-2 px-2 border border-[#0B2545] text-left w-36">
                  DELEGACIA / UNIDADE
                </th>
                <th className="py-2 px-2 border border-[#0B2545] text-left w-48">
                  DELEGADO(A) TITULAR
                </th>
                <th className="py-2 px-2 border border-[#0B2545] text-left w-44">ESCRIVÃES</th>
                <th className="py-2 px-2 border border-[#0B2545] text-left">
                  AGENTES / INVESTIGADORES
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
                      {getNome(u.delegado) || '-'}
                    </td>
                    <td className="py-2 px-2 border-r border-gray-300 align-top">
                      {escList.length === 0 ? (
                        <span className="text-gray-400 italic">-</span>
                      ) : (
                        <div className="space-y-1">
                          {escList.map((id) => (
                            <div key={id} className="font-medium text-gray-900">
                              • {getNome(id)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 align-top">
                      {agList.length === 0 ? (
                        <span className="text-gray-400 italic">-</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          {agList.map((id) => (
                            <span key={id} className="font-medium text-gray-900">
                              • {getNome(id)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Rodapé de Homologação na Impressão */}
          <div className="mt-8 pt-6 border-t border-gray-300 flex justify-between items-end text-[10px]">
            <div>
              <p className="font-semibold text-[#0B2545]">Polícia Civil da Paraíba</p>
              <p className="text-gray-500">Expediente Oficial das Unidades Policiais</p>
            </div>
            <div className="text-center">
              <div className="w-52 border-b border-black mb-1" />
              <p className="font-bold text-[#0B2545]">Delegado Seccional de Polícia Civil</p>
              <p className="text-gray-500">20ª DSPC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmação Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Remover Unidade Policial
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6B7280]">
              Deseja realmente remover esta Delegacia/Unidade? Os servidores nela lotados ficarão
              livres para serem alocados em outras unidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Removendo...' : 'Sim, Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
