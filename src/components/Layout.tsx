import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
  ChevronDown,
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

export default function Layout() {
  const { user, isAdmin, isVisitor, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      {/* Banner de Modo Visitante */}
      {isVisitor && !isAdmin && (
        <div className="no-print bg-[#0B2545] text-white text-xs sm:text-sm py-2 px-4 shadow-inner flex items-center justify-between">
          <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
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

      {/* Top Navbar */}
      <header className="no-print sticky top-0 z-40 bg-white border-b border-[#E5E9F0] shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/' : '/escala-publica')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="h-11 w-10 flex items-center justify-center transition-transform group-hover:scale-105">
                <BrasaoPCPB className="h-10 w-auto max-w-[40px] drop-shadow-sm" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-base text-[#0B2545] leading-tight flex items-center gap-1.5">
                  20ª DSPC
                </h1>
                <p className="text-[11px] text-[#6B7280]">Gestão de Escalas Policiais</p>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 max-w-[calc(100vw-360px)] no-scrollbar">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#0B2545] text-white shadow-xs font-semibold'
                        : 'text-[#4B5563] hover:text-[#0B2545] hover:bg-[#F5F7FA]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
          {/* User Section & Mobile Trigger */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-[#E5E9F0] hover:bg-[#F5F7FA]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-semibold text-xs">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                    </div>
                    <div className="text-left hidden lg:block text-xs">
                      <p className="font-semibold text-[#0B2545] leading-tight max-w-[120px] truncate">
                        {user?.name || user?.email || 'Administrador'}
                      </p>
                      <p className="text-[#6B7280] text-[10px]">Polícia Civil</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium text-sm text-[#0B2545]">
                      {user?.name || 'Administrador'}
                    </p>
                    <p className="text-xs text-[#6B7280] font-normal truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/escala-publica')}
                    className="cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2 text-[#0B2545]" />
                    Ver Link Público
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
                className="hidden sm:inline-flex items-center gap-1.5 border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white"
              >
                <LogIn className="w-4 h-4" />
                Login Admin
              </Button>
            )}

            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-[#0B2545]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E9F0] bg-white px-4 pt-2 pb-6 space-y-1 animate-fade-in-down shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-[#0B2545] text-white'
                        : 'text-[#1F2937] hover:bg-[#F5F7FA] hover:text-[#0B2545]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              )
            })}



            <div className="pt-3 border-t border-[#E5E9F0] mt-2">
              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
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
                  className="w-full bg-[#0B2545] text-white hover:bg-[#081A33]"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Fazer Login como Administrador
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Institutional Footer */}
      <footer className="no-print bg-white border-t border-[#E5E9F0] py-4 text-center text-xs text-[#6B7280]">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrasaoPCPB className="w-4 h-auto" />
            <span className="font-medium text-[#0B2545]">20 DSPC</span>
            <span>•</span>
            <span>Polícia Civil da Paraíba</span>
          </div>
          <p>
            © {new Date().getFullYear()} Gestão de Escalas Operacionais Policiais. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
