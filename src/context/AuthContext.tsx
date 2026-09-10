import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthRecord } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: AuthRecord | null
  isAdmin: boolean
  isVisitor: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  enterAsVisitor: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthRecord | null>(pb.authStore.record)
  const [isVisitor, setIsVisitor] = useState<boolean>(() => {
    return localStorage.getItem('escala_guest_mode') === 'true'
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Initial sync
    setUser(pb.authStore.record)
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
      if (record) {
        setIsVisitor(false)
        localStorage.removeItem('escala_guest_mode')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    setIsVisitor(false)
    localStorage.removeItem('escala_guest_mode')
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setIsVisitor(false)
    localStorage.removeItem('escala_guest_mode')
  }

  const enterAsVisitor = () => {
    setIsVisitor(true)
    localStorage.setItem('escala_guest_mode', 'true')
  }

  const isAdmin = !!user && pb.authStore.isValid

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isVisitor,
        isLoading,
        login,
        logout,
        enterAsVisitor,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
