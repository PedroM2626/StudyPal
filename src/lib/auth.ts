import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getProfile, updateProfile, Profile } from '@/services/profile'
import { AuthUser } from '@supabase/supabase-js'

export type User = AuthUser & Profile

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    const profile = await getProfile(authUser.id)
    if (profile) {
      setUser({ ...authUser, ...profile })
    } else {
      // This case might happen for a brand new user, handle appropriately
      setUser({ ...authUser } as User)
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Initial check
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user)
      }
      setLoading(false)
    }
    checkSession()

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const login = (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for login.')
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signup = (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for signup.')
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split('@')[0],
        },
      },
    })
  }

  const logout = () => supabase.auth.signOut()

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('User not authenticated')
    const updatedProfileData = await updateProfile(user.id, updates)
    if (updatedProfileData) {
      // Atualiza o estado imediatamente com os novos dados
      const updatedUser = { ...user, ...updatedProfileData }
      setUser(updatedUser)
      // Força uma atualização adicional para garantir que o estado seja refletido
      setTimeout(() => {
        setUser({ ...updatedUser })
      }, 0)
    }
  }

  return { user, loading, login, signup, logout, updateUserProfile }
}
