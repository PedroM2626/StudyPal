import { createContext, useContext, ReactNode } from 'react'
import { useAuth, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (
    email: string,
    password?: string,
  ) => ReturnType<typeof supabase.auth.signInWithPassword>
  signup: (
    email: string,
    password?: string,
  ) => ReturnType<typeof supabase.auth.signUp>
  logout: () => Promise<void>
  updateUserProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!auth.user) return
    await auth.updateUserProfile(updates)
  }

  const value = {
    ...auth,
    updateUserProfile: handleUpdateProfile,
  }

  return (
    <AuthContext.Provider value={value as AuthContextType}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
