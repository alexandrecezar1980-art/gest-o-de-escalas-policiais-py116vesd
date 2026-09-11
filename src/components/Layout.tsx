import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  CalendarCheck2,
  UserCheck,
  Car,
  Clock,
  FileSpreadsheet,
  FileText,
  LogOut,
  LogIn,
  Menu,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import BrasaoPCPB from '@/components/BrasaoPCPB'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import CentralImpressaoModal from '@/components/CentralImpressaoModal'

export default function Layout() {
  const { user, isAdmin, isVisitor, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Sidebar retrátil (estado persistido em localStorage se desejar)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pcpb_sidebar_collapsed')
      return saved === 'true'
    } catch {
      return false
    }
  })

  // Drawer mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modal Central de Impressão
  const [centralImpressaoOpen, setCentralImpressaoOpen] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('pcpb_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 10 itens especificados:
  // Painel, Servidores, Lotação, Férias, Escala Mensal, Relatório, Atribuições, Escala de Delegados, Escala de Custódias, Permanência
  const navItems = [
    { label: 'Painel', to: '/', icon: LayoutDashboard, adminOnly: true },
    { label: 'Servidores', to: '/servidores', icon: Users, adminOnly: true },
    { label: 'Lotação', to: '/locacao', icon: Building2, adminOnly: true },
    { label: 'Férias', to: '/ferias', icon: CalendarDays, adminOnly: true },
    {
      label: 'Escala Mensal',
      to: isAdmin ? '/escala-mensal' : '/escala-publica',
      icon: CalendarCheck2,
      adminOnly: false,
    },
    { label: 'Relatório', to: '/relatorio', icon: FileSpreadsheet, adminOnly: false },
    { label: 'Atribuições', to: '/relatorio#atribuicoes', icon: FileText, adminOnly: false },
    { label: 'Escala de Delegados', to: '/escala-delegados', icon: UserCheck, adminOnly: false },
    { label: 'Escala de Custódias', to: '/escala-custodias', icon: Car, adminOnly: true },
    { label: 'Permanência', to: '/permanencia', icon: Clock, adminOnly: true },
  ]

  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true
    return !item.adminOnly
  })

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
        {/* Banner de Modo Visitante */}
        {isVisitor && !isAdmin && (
          <div className="no-print bg-[#0B2545] text-white text-xs sm:text-sm py-2 px-4 shadow-inner flex items-center justify-between shrink-0">
            <div className="w-full flex items-center justify-between max-w-[1920px] mx-auto">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C9A227]" />
                <span>
                  <strong>Modo Visitante:</strong> Você está visualizando as escalas em modo somente
                  leitura (filtros e impressão habilitados).
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-white border-white/30 hover:bg-white/10 hover:text-white h-7 text-xs"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Entrar como Admin
              </Button>
            </div>
          </div>
        )}

        {/* Top Header Barra Superior (Global) */}
        <header className="no-print sticky top-0 z-30 bg-white border-b border-[#E5E9F0] shadow-xs backdrop-blur-md bg-white/95 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-[#0B2545] h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Desktop Toggle Sidebar Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
              className="hidden lg:flex text-[#0B2545] hover:bg-slate-100 h-9 w-9"
              title={sidebarCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-[#0B2545]" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-[#0B2545]" />
              )}
            </Button>

            {/* Identidade Top Header */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-8 flex items-center justify-center shrink-0">
                <BrasaoPCPB className="h-8 w-auto max-w-[32px] drop-shadow-xs" />
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-sm sm:text-base text-[#0B2545] tracking-tight flex items-center gap-1.5">
                  20ª DSPC <span className="text-gray-300 font-normal">|</span> Gestão de Escalas
                </h1>
                <p className="text-[10px] text-[#6B7280] hidden sm:block">
                  Polícia Civil do Estado da Paraíba
                </p>
              </div>
            </div>
          </div>

          {/* Ações Top Header: Central de Impressão + Perfil */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão Central de Impressão Proeminente no Header */}
            {isAdmin && (
              <Button
                onClick={() => setCentralImpressaoOpen(true)}
                className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 px-3 flex items-center gap-1.5 shadow-sm font-medium transition-all"
                title="Central Unificada de Impressão em Lote"
              >
                <Printer className="w-4 h-4 text-[#C9A227]" />
                <span className="hidden sm:inline">Central de Impressão</span>
                <span className="sm:hidden">Imprimir</span>
              </Button>
            )}

            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 h-9 rounded-lg border border-[#E5E9F0] hover:bg-[#F5F7FA]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-[10px]">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                    </div>
                    <div className="text-left hidden md:block text-xs">
                      <p className="font-semibold text-[#0B2545] leading-tight max-w-[120px] truncate">
                        {user?.name || user?.email || 'Administrador'}
                      </p>
                      <p className="text-[#6B7280] text-[9px]">PCPB Admin</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-semibold text-xs text-[#0B2545]">
                      {user?.name || 'Administrador'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] font-normal truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCentralImpressaoOpen(true)}
                    className="cursor-pointer text-xs"
                  >
                    <Printer className="w-4 h-4 mr-2 text-[#0B2545]" />
                    Central de Impressão Multiescalas
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/escala-publica')}
                    className="cursor-pointer text-xs"
                  >
                    <Eye className="w-4 h-4 mr-2 text-[#0B2545]" />
                    Ver Link Público
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair do Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white h-9 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login Admin
              </Button>
            )}
          </div>
        </header>

        {/* Corpo Principal com Sidebar + Área de Conteúdo */}
        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR RETRÁTIL (DESKTOP) */}
          <aside
            className={`no-print hidden lg:flex flex-col bg-white border-r border-[#E5E9F0] transition-all duration-300 ease-in-out shrink-0 select-none ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            {/* Header da Sidebar */}
            <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#C9A227]" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-[#0B2545] leading-tight">
                      Painel Operacional
                    </p>
                    <p className="text-[10px] text-[#6B7280]">Gestão de Escalas</p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#C9A227]" />
                  </div>
                </div>
              )}
            </div>

            {/* Itens de Navegação (10 itens) */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to.split('#')[0]) &&
                      (item.to.includes('#') ? location.hash === `#${item.to.split('#')[1]}` : true)

                // Item recolhido com Tooltip
                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          className={`flex items-center justify-center w-12 h-11 mx-auto rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#0B2545] text-white shadow-xs font-semibold'
                              : 'text-[#4B5563] hover:text-[#0B2545] hover:bg-[#F5F7FA]'
                          }`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="sr-only">{item.label}</span>
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-[#0B2545] text-white text-xs font-medium border-none shadow-md"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                // Item expandido com Ícone + Rótulo
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0B2545] text-white shadow-xs font-semibold'
                        : 'text-[#4B5563] hover:text-[#0B2545] hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Rodapé da Sidebar */}
            <div className="p-3 border-t border-[#E5E9F0]">
              {!sidebarCollapsed ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrasaoPCPB className="w-4 h-auto" />
                    <span className="text-[10px] text-[#6B7280] font-medium">PCPB • 20ª DSPC</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSidebar}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-[#0B2545]"
                    title="Recolher Sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSidebar}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-[#0B2545]"
                    title="Expandir Sidebar"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* DRAWER MOBILE (RESPONSIVO) */}
          {mobileMenuOpen && (
            <div className="no-print lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
              <div className="w-72 bg-white h-full shadow-2xl flex flex-col animate-fade-in">
                {/* Header do Drawer */}
                <div className="p-4 border-b border-[#E5E9F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrasaoPCPB className="h-8 w-auto max-w-[32px]" />
                    <div>
                      <h2 className="font-bold text-sm text-[#0B2545]">Gestão de Escalas</h2>
                      <p className="text-[10px] text-[#6B7280]">20ª DSPC / PCPB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Itens do Drawer */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setCentralImpressaoOpen(true)
                      }}
                      className="w-full bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 mb-2 flex items-center justify-start gap-2 shadow-xs"
                    >
                      <Printer className="w-4 h-4 text-[#C9A227]" />
                      Central de Impressão Multiescalas
                    </Button>
                  )}

                  {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                            isActive
                              ? 'bg-[#0B2545] text-white shadow-xs font-semibold'
                              : 'text-[#1F2937] hover:bg-[#F5F7FA] hover:text-[#0B2545]'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </nav>

                {/* Rodapé do Drawer */}
                <div className="p-3 border-t border-[#E5E9F0]">
                  {isAdmin ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full justify-start text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-9"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da Conta
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        navigate('/login')
                      }}
                      className="w-full bg-[#0B2545] text-white hover:bg-[#081A33] text-xs h-9"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login Administrador
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* ÁREA DE CONTEÚDO PRINCIPAL (EXPANDE 100% QUANDO A SIDEBAR ESTÁ RECOLHIDA) */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1920px] mx-auto transition-all">
            <Outlet />
          </main>
        </div>

        {/* Rodapé Institucional */}
        <footer className="no-print bg-white border-t border-[#E5E9F0] py-3 text-center text-xs text-[#6B7280] shrink-0">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BrasaoPCPB className="w-4 h-auto" />
              <span className="font-semibold text-[#0B2545]">20ª DSPC</span>
              <span>•</span>
              <span>Polícia Civil do Estado da Paraíba</span>
            </div>
            <p className="text-[11px]">
              © {new Date().getFullYear()} Gestão de Escalas Operacionais Policiais. Sistema
              Integrado.
            </p>
          </div>
        </footer>

        {/* Modal Global da Central de Impressão Multiescalas */}
        <CentralImpressaoModal open={centralImpressaoOpen} onOpenChange={setCentralImpressaoOpen} />
      </div>
    </TooltipProvider>
  )
}
