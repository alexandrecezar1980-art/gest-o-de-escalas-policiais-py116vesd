import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Users, Plus, Search, Edit2, Trash2, Phone, ShieldCheck, AlertCircle } from 'lucide-react'
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
import { servidoresService } from '@/services/policeServices'
import type { Servidor, CargoServidor, StatusServidor } from '@/types/police'
import { formatarTelefone } from '@/lib/escalaRules'
import useRealtime from '@/hooks/use-realtime'

export default function Servidores() {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCargo, setFiltroCargo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Modal Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formCargo, setFormCargo] = useState<CargoServidor>('Agente/Investigador')
  const [formTelefone, setFormTelefone] = useState('')
  const [formStatus, setFormStatus] = useState<StatusServidor>('Ativo')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal Confirmação Exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [servidorParaDeletar, setServidorParaDeletar] = useState<Servidor | null>(null)
  const [deleting, setDeleting] = useState(false)

  const carregarServidores = useCallback(async () => {
    try {
      setLoading(true)
      const data = await servidoresService.getAll()
      setServidores(data)
    } catch (err) {
      console.error('Erro ao buscar servidores:', err)
      toast.error('Erro ao carregar lista de servidores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarServidores()
  }, [carregarServidores])

  // Realtime
  useRealtime('servidores', () => carregarServidores())

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormNome('')
    setFormCargo('Agente/Investigador')
    setFormTelefone('')
    setFormStatus('Ativo')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (s: Servidor) => {
    setEditingId(s.id)
    setFormNome(s.nome)
    setFormCargo(s.cargo)
    setFormTelefone(s.telefone)
    setFormStatus(s.status)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formNome.trim()) {
      setFormError('O Nome Completo é obrigatório.')
      return
    }
    if (!formTelefone.trim() || formTelefone.replace(/\D/g, '').length < 10) {
      setFormError('Informe um telefone/WhatsApp válido com DDD.')
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        await servidoresService.update(editingId, {
          nome: formNome.trim(),
          cargo: formCargo,
          telefone: formTelefone.trim(),
          status: formStatus,
        })
        toast.success('Servidor atualizado com sucesso!')
      } else {
        await servidoresService.create({
          nome: formNome.trim(),
          cargo: formCargo,
          telefone: formTelefone.trim(),
          status: formStatus,
        })
        toast.success('Servidor cadastrado com sucesso!')
      }
      setIsModalOpen(false)
      carregarServidores()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar servidor.'
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
      await servidoresService.delete(deleteId)
      toast.success('Servidor excluído com sucesso!')
      setDeleteId(null)
      setServidorParaDeletar(null)
      carregarServidores()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao excluir servidor.'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const servidoresFiltrados = useMemo(() => {
    return servidores.filter((s) => {
      const matchSearch =
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) || s.telefone.includes(searchTerm)
      const matchCargo = filtroCargo === 'todos' || s.cargo === filtroCargo
      const matchStatus = filtroStatus === 'todos' || s.status === filtroStatus
      return matchSearch && matchCargo && matchStatus
    })
  }, [servidores, searchTerm, filtroCargo, filtroStatus])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Módulo de Efetivo Policial
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B2545]" />
            Cadastro de Servidores
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Gerenciamento do efetivo: Delegados, Escrivães e Agentes/Investigadores da Polícia
            Civil.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#0B2545] hover:bg-[#081A33] text-white font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Servidor
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-[#D1D5DB]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filtroCargo} onValueChange={setFiltroCargo}>
            <SelectTrigger className="h-10 w-full sm:w-[200px] border-[#D1D5DB]">
              <SelectValue placeholder="Filtrar por Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Cargos</SelectItem>
              <SelectItem value="Delegado">Delegado</SelectItem>
              <SelectItem value="Escrivão">Escrivão</SelectItem>
              <SelectItem value="Agente/Investigador">Agente/Investigador</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-10 w-full sm:w-[150px] border-[#D1D5DB]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Servidores */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E9F0] text-[#0B2545] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Nome Completo</th>
                <th className="py-3.5 px-4">Cargo / Função</th>
                <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                    Carregando servidores...
                  </td>
                </tr>
              ) : servidoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                    Nenhum servidor encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                servidoresFiltrados.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-[#F5F7FA] transition-colors ${
                      index % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-[#1F2937]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0B2545]/10 text-[#0B2545] font-bold flex items-center justify-center text-xs">
                          {s.nome.slice(0, 1)}
                        </div>
                        <div>
                          <span>{s.nome}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`font-medium text-xs ${
                          s.cargo === 'Delegado'
                            ? 'bg-[#0B2545]/10 text-[#0B2545] border-[#0B2545]/30'
                            : s.cargo === 'Escrivão'
                              ? 'bg-blue-50 text-[#1D4E89] border-blue-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {s.cargo}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#1F2937] font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280]" />
                        {s.telefone}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.status === 'Ativo' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 p-0 text-[#0B2545] hover:bg-[#D6E4F0]"
                          title="Editar Servidor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setServidorParaDeletar(s)
                            setDeleteId(s.id)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Excluir Servidor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[#F5F7FA] border-t border-[#E5E9F0] text-xs text-[#6B7280] flex items-center justify-between">
          <span>
            Exibindo <strong>{servidoresFiltrados.length}</strong> de{' '}
            <strong>{servidores.length}</strong> servidores
          </span>
          <span className="text-[11px]">Sistema de Escalas Operacionais Policiais</span>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0B2545]" />
              {editingId ? 'Editar Servidor' : 'Cadastrar Novo Servidor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Preencha os dados do servidor policial para compor as escalas e lotações.
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
              <Label htmlFor="nome" className="text-xs font-semibold text-[#1F2937]">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                placeholder="Ex.: Carlos Eduardo Andrade"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="h-10 border-[#D1D5DB]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cargo" className="text-xs font-semibold text-[#1F2937]">
                Cargo / Função *
              </Label>
              <Select value={formCargo} onValueChange={(val) => setFormCargo(val as CargoServidor)}>
                <SelectTrigger id="cargo" className="h-10 border-[#D1D5DB]">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delegado">Delegado</SelectItem>
                  <SelectItem value="Escrivão">Escrivão</SelectItem>
                  <SelectItem value="Agente/Investigador">Agente/Investigador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-xs font-semibold text-[#1F2937]">
                Telefone / WhatsApp com DDD *
              </Label>
              <Input
                id="telefone"
                placeholder="(83) 99999-9999"
                value={formTelefone}
                onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                className="h-10 border-[#D1D5DB] font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1F2937]">
                Status Operacional
              </Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as StatusServidor)}
              >
                <SelectTrigger id="status" className="h-10 border-[#D1D5DB]">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo (Disponível para escalas)</SelectItem>
                  <SelectItem value="Inativo">Inativo (Afastado/Licença)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#D1D5DB] text-[#1F2937]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0B2545] hover:bg-[#081A33] text-white"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Servidor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Confirmar Exclusão de Servidor
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6B7280]">
              Deseja realmente remover o servidor <strong>{servidorParaDeletar?.nome}</strong> (
              {servidorParaDeletar?.cargo})?
              <br />
              <br />
              <strong className="text-amber-800">Atenção:</strong> Se o servidor possuir escalas ou
              estiver lotado em uma Delegacia/Unidade, a exclusão será bloqueada pelo sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
