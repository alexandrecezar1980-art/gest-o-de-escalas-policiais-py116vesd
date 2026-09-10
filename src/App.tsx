import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Servidores from '@/pages/Servidores'
import Locacao from '@/pages/Locacao'
import Ferias from '@/pages/Ferias'
import EscalaMensal from '@/pages/EscalaMensal'
import Relatorio from '@/pages/Relatorio'
import EscalaPublica from '@/pages/EscalaPublica'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors position="top-right" />
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rota pública para acesso livre de visitantes via link compartilhado */}
          <Route path="/escala-publica" element={<EscalaPublica />} />

          {/* Layout com Navbar para rotas autenticadas ou com permissão visitante */}
          <Route element={<Layout />}>
            {/* Dashboard / Painel (Admin) */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Cadastro de Servidores (Admin) */}
            <Route
              path="/servidores"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Servidores />
                </ProtectedRoute>
              }
            />

            {/* Lotação das Unidades (Admin) */}
            <Route
              path="/locacao"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Locacao />
                </ProtectedRoute>
              }
            />

            {/* Férias dos Servidores (Admin) */}
            <Route
              path="/ferias"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Ferias />
                </ProtectedRoute>
              }
            />

            {/* Motor da Escala Mensal (Admin) */}
            <Route
              path="/escala-mensal"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EscalaMensal />
                </ProtectedRoute>
              }
            />

            {/* Relatório e Área de Impressão (Admin + Visitante) */}
            <Route
              path="/relatorio"
              element={
                <ProtectedRoute allowedRoles={['admin', 'visitor']}>
                  <Relatorio />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
