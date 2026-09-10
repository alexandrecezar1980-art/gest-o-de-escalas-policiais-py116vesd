import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Lock, Mail, Eye, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BrasaoPCPB from '@/components/BrasaoPCPB'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function Login() {
  const { login, enterAsVisitor, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('alexandrecezar1980@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/')
    }
  }, [isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.')
      return
    }

    try {
      setLoading(true)
      await login(email.trim(), password)
      toast.success('Autenticação realizada com sucesso!')
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar'
      if (msg.includes('Failed to authenticate') || msg.includes('400')) {
        setErrorMsg('E-mail ou senha inválidos. Verifique as credenciais e tente novamente.')
      } else {
        setErrorMsg('Erro de conexão com o servidor. Tente novamente mais tarde.')
      }
      toast.error('Não foi possível entrar no sistema.')
    } finally {
      setLoading(false)
    }
  }

  const handleVisitorAccess = () => {
    enterAsVisitor()
    toast.info('Entrando no sistema como Visitante (Somente Leitura)')
    navigate('/escala-publica')
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4 py-8">
      {/* Container Central */}
      <div className="w-full max-w-md">
        {/* Header institucional */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <BrasaoPCPB className="w-20 sm:w-24 h-auto max-h-28 drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Gestão de Escalas Policiais
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Polícia Civil da Paraíba • Acesso ao Sistema Operacional
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-xl border border-[#E5E9F0] shadow-md p-6 sm:p-8">
          <div className="mb-5 pb-4 border-b border-[#E5E9F0]">
            <h2 className="text-lg font-semibold text-[#0B2545]">Login Administrativo</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Entre com suas credenciais para gerenciar servidores e escalas
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#1F2937]">
                E-mail Institucional
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@policia.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 border-[#D1D5DB] focus-visible:ring-[#1D4E89]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-[#1F2937]">
                  Senha
                </Label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 border-[#D1D5DB] focus-visible:ring-[#1D4E89]"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0B2545]"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Credenciais preenchidas informadas ao usuário */}
            <div className="rounded-md bg-[#F5F7FA] border border-[#E5E9F0] p-2.5 text-xs text-[#6B7280]">
              <div className="flex items-center gap-1.5 text-[#0B2545] font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Credencial Padrão Inicial (Admin):
              </div>
              <p className="font-mono text-[11px] text-[#1F2937]">
                alexandrecezar1980@gmail.com / Skip@Pass
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#0B2545] hover:bg-[#081A33] text-white font-medium text-sm transition-colors shadow-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E9F0]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#6B7280]">ou acesso livre</span>
            </div>
          </div>

          {/* Botão Visitante */}
          <Button
            type="button"
            variant="outline"
            onClick={handleVisitorAccess}
            className="w-full h-10 border-[#0B2545] text-[#0B2545] hover:bg-[#F5F7FA] font-medium text-sm flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-[#C9A227]" />
            Acessar como Visitante (Somente Leitura)
          </Button>

          <p className="text-[11px] text-[#6B7280] text-center mt-3">
            O visitante pode consultar as escalas mensais, filtrar datas e imprimir relatórios A4 em
            PDF sem necessidade de senha.
          </p>
        </div>

        {/* Rodapé do Login */}
        <p className="text-center text-xs text-[#6B7280] mt-6">
          Governo do Estado • Secretaria de Estado da Segurança e Defesa Social
        </p>
      </div>
    </div>
  )
}
