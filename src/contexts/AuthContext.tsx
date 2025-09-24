import { createContext, useContext, ReactNode, useCallback } from 'react'
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

  const handleUpdateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!auth.user) return
      await auth.updateUserProfile(updates)
    },
    [auth.user, auth.updateUserProfile],
  )

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
  if (context !== undefined) return context as AuthContextType
  return useAuth()
}
