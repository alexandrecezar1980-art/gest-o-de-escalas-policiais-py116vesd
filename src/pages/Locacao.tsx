import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Building2, Plus, Edit2, Trash2, AlertCircle, Users, Layers } from 'lucide-react'
import BrasaoPCPB from '@/components/BrasaoPCPB'
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

  // Servidores já lotados em outras unidades (regra: 1 servidor só pode estar em 1 unidade)
  const servidoresLotadosEmOutras = useMemo(() => {
    const map = new Map<string, string>() // servidorId -> nomeDaUnidade
    for (const u of unidades) {
      if (editingId && u.id === editingId) continue // ignora a unidade em edição

      if (u.delegado) map.set(u.delegado, u.nome)
      if (u.escrivao1) map.set(u.escrivao1, u.nome)
      if (u.escrivao2) map.set(u.escrivao2, u.nome)
      for (let i = 1; i <= 8; i++) {
        const agId = (u as Record<string, unknown>)[`agente${i}`] as string | undefined
        if (agId) map.set(agId, u.nome)
      }
    }
    return map
  }, [unidades, editingId])

  // Listas de servidores por cargo
  const delegadosDisponiveis = useMemo(() => {
    return servidores.filter((s) => s.cargo === 'Delegado' && s.status === 'Ativo')
  }, [servidores])

  const escrivaesDisponiveis = useMemo(() => {
    return servidores.filter((s) => s.cargo === 'Escrivão' && s.status === 'Ativo')
  }, [servidores])

  const agentesDisponiveis = useMemo(() => {
    return servidores.filter((s) => s.cargo === 'Agente/Investigador' && s.status === 'Ativo')
  }, [servidores])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormNome('')
    setFormDelegado('')
    setFormEscrivaes([])
    setFormAgentes([])
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (u: Unidade) => {
    setEditingId(u.id)
    setFormNome(u.nome)
    setFormDelegado(u.delegado || '')

    const esc: string[] = []
    if (u.escrivao1) esc.push(u.escrivao1)
    if (u.escrivao2) esc.push(u.escrivao2)
    setFormEscrivaes(esc)

    const ags: string[] = []
    for (let i = 1; i <= 8; i++) {
      const agId = (u as Record<string, unknown>)[`agente${i}`] as string | undefined
      if (agId) ags.push(agId)
    }
    setFormAgentes(ags)
    setFormError('')
    setIsModalOpen(true)
  }

  const toggleEscrivao = (id: string) => {
    if (formEscrivaes.includes(id)) {
      setFormEscrivaes(formEscrivaes.filter((x) => x !== id))
    } else {
      if (formEscrivaes.length >= 2) {
        toast.warning('Limite máximo de 02 Escrivães por unidade atingido.')
        return
      }
      setFormEscrivaes([...formEscrivaes, id])
    }
  }

  const toggleAgente = (id: string) => {
    if (formAgentes.includes(id)) {
      setFormAgentes(formAgentes.filter((x) => x !== id))
    } else {
      if (formAgentes.length >= 8) {
        toast.warning('Limite máximo de 08 Agentes/Investigadores por unidade atingido.')
        return
      }
      setFormAgentes([...formAgentes, id])
    }
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
    if (formEscrivaes.length > 2) {
      setFormError('Permitido no máximo 02 Escrivães por Unidade.')
      return
    }
    if (formAgentes.length > 8) {
      setFormError('Permitido no máximo 08 Agentes/Investigadores por Unidade.')
      return
    }

    const payload: Partial<Unidade> = {
      nome: formNome.trim(),
      delegado: formDelegado,
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

  // Tabela Consolidada: qual Delegacia cada servidor trabalha
  const tabelaConsolidada = useMemo(() => {
    return servidores
      .map((s) => {
        // Encontrar unidade em que o servidor está lotado
        const und = unidades.find((u) => {
          if (u.delegado === s.id) return true
          if (u.escrivao1 === s.id || u.escrivao2 === s.id) return true
          for (let i = 1; i <= 8; i++) {
            if ((u as Record<string, unknown>)[`agente${i}`] === s.id) return true
          }
          return false
        })

        return {
          servidor: s,
          unidadeNome: und ? und.nome : 'Sem lotação definida',
          isLotado: !!und,
        }
      })
      .sort((a, b) => {
        if (a.isLotado && !b.isLotado) return -1
        if (!a.isLotado && b.isLotado) return 1
        return a.servidor.nome.localeCompare(b.servidor.nome)
      })
  }, [servidores, unidades])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Expediente e Estrutura
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0B2545]" />
            Lotação das Unidades Policiais
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Cadastre as Delegacias/Unidades e vincule o efetivo: 01 Delegado, até 02 Escrivães e até
            08 Agentes por unidade.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#0B2545] hover:bg-[#081A33] text-white font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Unidade
        </Button>
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
            const escrivaesList = [u.escrivao1, u.escrivao2].filter(Boolean) as string[]
            const agentesList = [
              u.agente1,
              u.agente2,
              u.agente3,
              u.agente4,
              u.agente5,
              u.agente6,
              u.agente7,
              u.agente8,
            ].filter(Boolean) as string[]

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
                        Delegado Responsável (01):
                      </span>
                      <p className="font-semibold text-[#0B2545] mt-0.5 flex items-center gap-1.5">
                        <BrasaoPCPB className="w-3.5 h-auto" />
                        {getNome(u.delegado) || 'Não definido'}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] block">
                        Escrivães ({escrivaesList.length}/2):
                      </span>
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
                      <span className="font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] block">
                        Agentes / Investigadores ({agentesList.length}/8):
                      </span>
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
                  </div>
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

      {/* Modal Cadastro/Edição de Unidade */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0B2545]" />
              {editingId ? 'Editar Lotação da Unidade' : 'Cadastrar Nova Unidade'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Configure a unidade policial respeitando os limites prescritos: 01 Delegado, até 02
              Escrivães e até 08 Agentes.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="unidadeNome" className="text-xs font-semibold text-[#1F2937]">
                Nome da Delegacia / Unidade *
              </Label>
              <Input
                id="unidadeNome"
                placeholder="Ex.: DEAM, 1ª DD, 2ª DD, GTE..."
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="h-10 border-[#D1D5DB]"
                required
              />
            </div>

            {/* Delegado Responsável (01) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="delegado"
                className="text-xs font-semibold text-[#1F2937] flex items-center justify-between"
              >
                <span>01 Delegado Responsável *</span>
                <span className="text-[11px] text-[#6B7280]">Obrigatório (limite exato de 01)</span>
              </Label>
              <Select value={formDelegado} onValueChange={setFormDelegado}>
                <SelectTrigger id="delegado" className="h-10 border-[#D1D5DB]">
                  <SelectValue placeholder="Selecione o Delegado Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {delegadosDisponiveis.map((d) => {
                    const lotadoEm = servidoresLotadosEmOutras.get(d.id)
                    const disabled = !!lotadoEm
                    return (
                      <SelectItem key={d.id} value={d.id} disabled={disabled}>
                        {d.nome} {lotadoEm ? `(Já lotado em: ${lotadoEm})` : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Escrivães (Até 02) */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Escrivães de Polícia (Até 02)</span>
                <span className="text-[11px] font-bold text-[#0B2545]">
                  Selecionados: {formEscrivaes.length} / 2
                </span>
              </Label>
              <div className="border border-[#D1D5DB] rounded-lg p-2.5 max-h-40 overflow-y-auto space-y-1 bg-[#F9FAFB]">
                {escrivaesDisponiveis.map((esc) => {
                  const lotadoEm = servidoresLotadosEmOutras.get(esc.id)
                  const isChecked = formEscrivaes.includes(esc.id)
                  const disabled = !!lotadoEm

                  return (
                    <label
                      key={esc.id}
                      className={`flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                        disabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-100'
                          : isChecked
                            ? 'bg-blue-100/70 border border-blue-300'
                            : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => toggleEscrivao(esc.id)}
                          className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                        />
                        <span className="font-medium text-[#1F2937]">{esc.nome}</span>
                      </div>
                      {lotadoEm && (
                        <span className="text-[10px] text-amber-700 italic">
                          Lotado em: {lotadoEm}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Agentes / Investigadores (Até 08) */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Agentes / Investigadores (Até 08)</span>
                <span className="text-[11px] font-bold text-[#0B2545]">
                  Selecionados: {formAgentes.length} / 8
                </span>
              </Label>
              <div className="border border-[#D1D5DB] rounded-lg p-2.5 max-h-52 overflow-y-auto space-y-1 bg-[#F9FAFB]">
                {agentesDisponiveis.map((ag) => {
                  const lotadoEm = servidoresLotadosEmOutras.get(ag.id)
                  const isChecked = formAgentes.includes(ag.id)
                  const disabled = !!lotadoEm

                  return (
                    <label
                      key={ag.id}
                      className={`flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                        disabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-100'
                          : isChecked
                            ? 'bg-blue-100/70 border border-blue-300'
                            : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => toggleAgente(ag.id)}
                          className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                        />
                        <span className="font-medium text-[#1F2937]">{ag.nome}</span>
                      </div>
                      {lotadoEm && (
                        <span className="text-[10px] text-amber-700 italic">
                          Lotado em: {lotadoEm}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#E5E9F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#D1D5DB]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0B2545] hover:bg-[#081A33] text-white"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar Unidade' : 'Cadastrar Unidade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
