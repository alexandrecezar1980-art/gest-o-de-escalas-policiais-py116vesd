import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'visitor')[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin'],
}) => {
  const { isAdmin, isVisitor, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0B2545] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If visitor is allowed and user is marked as visitor
  if (allowedRoles.includes('visitor') && (isVisitor || isAdmin)) {
    return <>{children}</>
  }

  // Only admin allowed
  if (allowedRoles.includes('admin') && isAdmin) {
    return <>{children}</>
  }

  // Redirect to login preserving location
  return <Navigate to="/login" state={{ from: location }} replace />
}
