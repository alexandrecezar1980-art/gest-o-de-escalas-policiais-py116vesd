import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  ShieldCheck,
  AlertCircle,
  Mail,
  Calendar,
  CreditCard,
  Hash,
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
import type { Servidor, CargoServidor, StatusServidor, DiaCompensacao } from '@/types/police'
import { formatarTelefone } from '@/lib/escalaRules'
import { formatarCpf, validarCpf, validarEmail } from '@/lib/cpfValidation'
import useRealtime from '@/hooks/use-realtime'

const DIAS_COMPENSACAO_OPCOES: DiaCompensacao[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
  'Rotativo',
]

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
  const [formCargosSecundarios, setFormCargosSecundarios] = useState<CargoServidor[]>([])
  const [formTelefone, setFormTelefone] = useState('')
  const [formStatus, setFormStatus] = useState<StatusServidor>('Ativo')
  const [formMatricula, setFormMatricula] = useState('')
  const [formCpf, setFormCpf] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formDiaCompensacao, setFormDiaCompensacao] = useState<string>('Rotativo')
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
    setFormCargosSecundarios([])
    setFormTelefone('')
    setFormStatus('Ativo')
    setFormMatricula('')
    setFormCpf('')
    setFormEmail('')
    setFormDiaCompensacao('Rotativo')
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (s: Servidor) => {
    setEditingId(s.id)
    setFormNome(s.nome)
    setFormCargo(s.cargo)
    setFormCargosSecundarios(Array.isArray(s.cargos_secundarios) ? s.cargos_secundarios : [])
    setFormTelefone(s.telefone)
    setFormStatus(s.status)
    setFormMatricula(s.matricula || '')
    setFormCpf(s.cpf ? formatarCpf(s.cpf) : '')
    setFormEmail(s.email || '')
    setFormDiaCompensacao(s.dia_compensacao || 'Rotativo')
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

    // Validação de CPF se preenchido
    if (formCpf.trim()) {
      if (!validarCpf(formCpf)) {
        setFormError('O CPF informado é inválido. Verifique os dígitos digitados.')
        toast.error('CPF inválido.')
        return
      }
    }

    // Validação de E-mail se preenchido
    if (formEmail.trim() && !validarEmail(formEmail)) {
      setFormError('Informe um endereço de e-mail válido (ex: servidor@policiacivil.pb.gov.br).')
      toast.error('E-mail inválido.')
      return
    }

    const payload = {
      nome: formNome.trim(),
      cargo: formCargo,
      cargos_secundarios: formCargosSecundarios.filter((c) => c !== formCargo),
      telefone: formTelefone.trim(),
      status: formStatus,
      matricula: formMatricula.trim() || undefined,
      cpf: formCpf.trim() ? formatarCpf(formCpf) : undefined,
      email: formEmail.trim() || undefined,
      dia_compensacao: formDiaCompensacao || 'Rotativo',
    }

    try {
      setSaving(true)
      if (editingId) {
        await servidoresService.update(editingId, payload)
        toast.success('Servidor atualizado com sucesso!')
      } else {
        await servidoresService.create(payload)
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
    const term = searchTerm.toLowerCase().trim()
    return servidores.filter((s) => {
      const matchSearch =
        !term ||
        s.nome.toLowerCase().includes(term) ||
        s.telefone.includes(term) ||
        (s.matricula && s.matricula.toLowerCase().includes(term)) ||
        (s.cpf && s.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, ''))) ||
        (s.email && s.email.toLowerCase().includes(term))
      const cargosDoServidor = [
        s.cargo,
        ...(Array.isArray(s.cargos_secundarios) ? s.cargos_secundarios : []),
      ]
      const matchCargo =
        filtroCargo === 'todos' ||
        s.cargo === filtroCargo ||
        cargosDoServidor.includes(filtroCargo as CargoServidor)
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
            placeholder="Buscar por nome, cargo, matrícula ou CPF..."
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
                <th className="py-3.5 px-4">Matrícula</th>
                <th className="py-3.5 px-4">CPF</th>
                <th className="py-3.5 px-4">Cargo / Função</th>
                <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                <th className="py-3.5 px-4">Compensação</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    Carregando servidores...
                  </td>
                </tr>
              ) : servidoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
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
                          <span className="font-semibold">{s.nome}</span>
                          {s.email && (
                            <span className="text-[11px] text-[#6B7280] block truncate max-w-[180px]">
                              {s.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#0B2545]">
                      {s.matricula ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          {s.matricula}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#1F2937]">
                      {s.cpf ? formatarCpf(s.cpf) : <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
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
                        {Array.isArray(s.cargos_secundarios) &&
                          s.cargos_secundarios.map((cs) => (
                            <Badge
                              key={cs}
                              variant="secondary"
                              className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-medium"
                              title="Função / Cargo Secundário"
                            >
                              + {cs}
                            </Badge>
                          ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#1F2937] font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280]" />
                        {s.telefone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#1F2937]">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        {s.dia_compensacao || 'Rotativo'}
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
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0B2545]" />
              {editingId ? 'Editar Servidor' : 'Cadastrar Novo Servidor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Preencha os dados cadastrais e funcionais do servidor policial para compor as escalas
              e lotações.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5 py-1 text-xs">
            {/* Nome Completo */}
            <div className="space-y-1">
              <Label htmlFor="nome" className="text-xs font-semibold text-[#1F2937]">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                placeholder="Ex.: Carlos Eduardo Andrade"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="h-9 border-[#D1D5DB] text-xs"
                required
              />
            </div>

            {/* Matrícula e CPF lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="matricula"
                  className="text-xs font-semibold text-[#1F2937] flex items-center gap-1"
                >
                  <Hash className="w-3 h-3 text-[#6B7280]" />
                  Matrícula Funcional
                </Label>
                <Input
                  id="matricula"
                  placeholder="Ex.: 123.456-7"
                  value={formMatricula}
                  onChange={(e) => setFormMatricula(e.target.value)}
                  className="h-9 border-[#D1D5DB] font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="cpf"
                  className="text-xs font-semibold text-[#1F2937] flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3 text-[#6B7280]" />
                  CPF (000.000.000-00)
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formCpf}
                  onChange={(e) => setFormCpf(formatarCpf(e.target.value))}
                  maxLength={14}
                  className="h-9 border-[#D1D5DB] font-mono text-xs"
                />
              </div>
            </div>

            {/* Cargo e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cargo" className="text-xs font-semibold text-[#1F2937]">
                  Cargo Principal *
                </Label>
                <Select
                  value={formCargo}
                  onValueChange={(val) => {
                    const novoCargo = val as CargoServidor
                    setFormCargo(novoCargo)
                    setFormCargosSecundarios((prev) => prev.filter((c) => c !== novoCargo))
                  }}
                >
                  <SelectTrigger id="cargo" className="h-9 border-[#D1D5DB] text-xs">
                    <SelectValue placeholder="Selecione o cargo principal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delegado">Delegado</SelectItem>
                    <SelectItem value="Escrivão">Escrivão</SelectItem>
                    <SelectItem value="Agente/Investigador">Agente/Investigador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-semibold text-[#1F2937]">
                  Status Operacional
                </Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as StatusServidor)}
                >
                  <SelectTrigger id="status" className="h-9 border-[#D1D5DB] text-xs">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo (Disponível)</SelectItem>
                    <SelectItem value="Inativo">Inativo (Afastado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Suporte a Multifunção / Cargo Duplo */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#0B2545]">
                  Funções Adicionais / Cargo Duplo (Multifunção)
                </Label>
                <span className="text-[10px] text-[#6B7280]">Opcional</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Marque se o servidor também atua em outras funções operacionais simultaneamente
                (ex.: Agente e Escrivão).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['Delegado', 'Escrivão', 'Agente/Investigador'] as CargoServidor[])
                  .filter((c) => c !== formCargo)
                  .map((c) => {
                    const isChecked = formCargosSecundarios.includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setFormCargosSecundarios((prev) => prev.filter((x) => x !== c))
                          } else {
                            setFormCargosSecundarios((prev) => [...prev, c])
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition-colors ${
                          isChecked
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#0B2545]/50'
                        }`}
                      >
                        <span>{isChecked ? '✓' : '+'}</span>
                        <span>{c}</span>
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Telefone e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="telefone"
                  className="text-xs font-semibold text-[#1F2937] flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-[#6B7280]" />
                  Telefone / WhatsApp *
                </Label>
                <Input
                  id="telefone"
                  placeholder="(83) 99999-9999"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                  className="h-9 border-[#D1D5DB] font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-[#1F2937] flex items-center gap-1"
                >
                  <Mail className="w-3 h-3 text-[#6B7280]" />
                  E-mail Funcional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome.sobrenome@policiacivil.pb.gov.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="h-9 border-[#D1D5DB] text-xs"
                />
              </div>
            </div>

            {/* Dia de Compensação */}
            <div className="space-y-1">
              <Label
                htmlFor="diaCompensacao"
                className="text-xs font-semibold text-[#1F2937] flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-[#6B7280]" />
                Dia de Folga Compensatória
              </Label>
              <Select value={formDiaCompensacao} onValueChange={setFormDiaCompensacao}>
                <SelectTrigger id="diaCompensacao" className="h-9 border-[#D1D5DB] text-xs">
                  <SelectValue placeholder="Selecione o dia de compensação" />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_COMPENSACAO_OPCOES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} {d === 'Rotativo' ? '(Sem dia fixo)' : '(Fixo semanal)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#6B7280]">
                Indica o dia padrão de compensação/folga do servidor pelas horas de plantão
                prestadas.
              </p>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E5E9F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#D1D5DB] text-[#1F2937] h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0B2545] hover:bg-[#081A33] text-white h-9 text-xs"
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
