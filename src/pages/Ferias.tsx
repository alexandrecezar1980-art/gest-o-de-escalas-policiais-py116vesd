import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { CalendarDays, Plus, Trash2, AlertTriangle, AlertCircle, Clock, Edit2 } from 'lucide-react'
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
import { feriasService, servidoresService } from '@/services/policeServices'
import type { Ferias, Servidor } from '@/types/police'
import { formatarDataBr } from '@/lib/escalaRules'
import useRealtime from '@/hooks/use-realtime'

export default function FeriasPage() {
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroMes, setFiltroMes] = useState<string>('todos')
  const [filtroAno, setFiltroAno] = useState<string>(String(new Date().getFullYear()))
  const [buscaServidor, setBuscaServidor] = useState('')

  // Modal Cadastro / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formServidor, setFormServidor] = useState('')
  const [formInicio, setFormInicio] = useState('')
  const [formFim, setFormFim] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [f, s] = await Promise.all([feriasService.getAll(), servidoresService.getAll()])
      setFerias(f)
      setServidores(s)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados de férias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useRealtime('ferias', () => carregarDados())
  useRealtime('servidores', () => carregarDados())

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormServidor('')
    // Defaults: hoje até 15 dias depois
    const today = new Date().toISOString().split('T')[0]
    const in15 = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
    setFormInicio(today)
    setFormFim(in15)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (f: Ferias) => {
    setEditingId(f.id)
    setFormServidor(f.servidor)
    setFormInicio(f.inicio.slice(0, 10))
    setFormFim(f.fim.slice(0, 10))
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formServidor) {
      setFormError('Selecione o servidor.')
      return
    }
    if (!formInicio || !formFim) {
      setFormError('Preencha as datas de início e fim.')
      return
    }

    const start = new Date(formInicio).getTime()
    const end = new Date(formFim).getTime()

    if (end < start) {
      setFormError('A data de término das férias deve ser posterior ou igual à data de início.')
      return
    }

    const payload = {
      servidor: formServidor,
      inicio: `${formInicio} 00:00:00.000Z`,
      fim: `${formFim} 00:00:00.000Z`,
    }

    try {
      setSaving(true)
      if (editingId) {
        await feriasService.update(editingId, payload)
        toast.success('Período de férias atualizado com sucesso!')
      } else {
        await feriasService.create(payload)
        toast.success('Férias cadastradas com sucesso!')
      }
      setIsModalOpen(false)
      carregarDados()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar período de férias.'
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
      await feriasService.delete(deleteId)
      toast.success('Período de férias removido com sucesso!')
      setDeleteId(null)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover férias.')
    } finally {
      setDeleting(false)
    }
  }

  // Helper servidor
  const getServidor = (id: string): Servidor | undefined => {
    return servidores.find((s) => s.id === id)
  }

  // Filtros aplicados
  const feriasFiltradas = useMemo(() => {
    return ferias.filter((f) => {
      const s = getServidor(f.servidor)
      const matchBusca =
        !buscaServidor || (s?.nome.toLowerCase().includes(buscaServidor.toLowerCase()) ?? false)

      const startDate = new Date(f.inicio)
      const startYear = startDate.getUTCFullYear()
      const startMonth = startDate.getUTCMonth() + 1

      const matchAno = filtroAno === 'todos' || String(startYear) === filtroAno
      const matchMes = filtroMes === 'todos' || String(startMonth) === filtroMes

      return matchBusca && matchAno && matchMes
    })
  }, [ferias, servidores, buscaServidor, filtroAno, filtroMes])

  const meses = [
    { num: '1', nome: 'Janeiro' },
    { num: '2', nome: 'Fevereiro' },
    { num: '3', nome: 'Março' },
    { num: '4', nome: 'Abril' },
    { num: '5', nome: 'Maio' },
    { num: '6', nome: 'Junho' },
    { num: '7', nome: 'Julho' },
    { num: '8', nome: 'Agosto' },
    { num: '9', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' },
    { num: '11', nome: 'Novembro' },
    { num: '12', nome: 'Dezembro' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B2545] bg-[#F5F7FA] px-2.5 py-0.5 rounded border border-[#E5E9F0]">
              Afastamentos Regulamentares
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mt-1.5 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#0B2545]" />
            Controle de Férias dos Servidores
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Cadastre os períodos de férias. Ao escalar um servidor em seu período de descanso, o
            sistema emitirá um alerta visual imediato.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#0B2545] hover:bg-[#081A33] text-white font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Férias
        </Button>
      </div>

      {/* Banner Informativo sobre Alerta do PRD */}
      <div className="bg-[#FDF3E7] border border-[#D97706]/40 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1F2937]">
          <strong className="text-[#0B2545] font-semibold">
            Regra de Proteção Operacional:
          </strong>{' '}
          Servidores com período de férias cadastrado geram um alerta visual (faixa
          âmbar/alaranjada) caso o administrador tente incluí-los na Escala Mensal no respectivo
          dia.
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E9F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nome do servidor..."
            value={buscaServidor}
            onChange={(e) => setBuscaServidor(e.target.value)}
            className="h-10 border-[#D1D5DB]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="h-10 w-full sm:w-[160px] border-[#D1D5DB]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {meses.map((m) => (
                <SelectItem key={m.num} value={m.num}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <SelectTrigger className="h-10 w-full sm:w-[130px] border-[#D1D5DB]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Anos</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Férias */}
      <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E9F0] text-[#0B2545] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Servidor Policial</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4">Início das Férias</th>
                <th className="py-3 px-4">Término das Férias</th>
                <th className="py-3 px-4">Duração</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    Carregando registros de férias...
                  </td>
                </tr>
              ) : feriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    Nenhum período de férias encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                feriasFiltradas.map((f, idx) => {
                  const s = getServidor(f.servidor)
                  const startMs = new Date(f.inicio).getTime()
                  const endMs = new Date(f.fim).getTime()
                  const dias = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-[#F5F7FA] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium text-[#0B2545]">
                        {s?.nome || 'Servidor não localizado'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-xs">
                          {s?.cargo || '-'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#1F2937]">
                        {formatarDataBr(f.inicio)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#1F2937]">
                        {formatarDataBr(f.fim)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {dias > 0 ? `${dias} dias` : '1 dia'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(f)}
                            className="h-8 w-8 p-0 text-[#0B2545] hover:bg-[#D6E4F0]"
                            title="Editar Período"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(f.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            title="Excluir Férias"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#0B2545]" />
              {editingId ? 'Editar Período de Férias' : 'Agendar Férias de Servidor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Informe o servidor policial e as datas inicial e final do período de férias.
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
              <Label htmlFor="servidorSelect" className="text-xs font-semibold text-[#1F2937]">
                Servidor Policial *
              </Label>
              <Select value={formServidor} onValueChange={setFormServidor}>
                <SelectTrigger id="servidorSelect" className="h-10 border-[#D1D5DB]">
                  <SelectValue placeholder="Selecione o servidor ativo" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {servidores
                    .filter((s) => s.status === 'Ativo')
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome} ({s.cargo})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inicio" className="text-xs font-semibold text-[#1F2937]">
                  Data Início *
                </Label>
                <Input
                  id="inicio"
                  type="date"
                  value={formInicio}
                  onChange={(e) => setFormInicio(e.target.value)}
                  className="h-10 border-[#D1D5DB]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fim" className="text-xs font-semibold text-[#1F2937]">
                  Data Término *
                </Label>
                <Input
                  id="fim"
                  type="date"
                  value={formFim}
                  onChange={(e) => setFormFim(e.target.value)}
                  className="h-10 border-[#D1D5DB]"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-[#F5F7FA] border border-[#E5E9F0] rounded-lg text-xs text-[#6B7280]">
              <span className="font-semibold text-[#0B2545] block">
                Validação anti-sobreposição:
              </span>
              O sistema verifica automaticamente se já existe período marcado para este servidor no
              mesmo intervalo.
            </div>

            <DialogFooter className="pt-2">
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
                {saving ? 'Gravando...' : editingId ? 'Salvar Alterações' : 'Confirmar Férias'}
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
              Cancelar Período de Férias
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6B7280]">
              Deseja remover este registro de férias? O servidor voltará a constar como liberado
              para escalas no período.
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
