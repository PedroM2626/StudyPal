import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getProfile, updateProfile, Profile } from '@/services/profile'
import { AuthUser } from '@supabase/supabase-js'

export type User = AuthUser & Profile

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchUserProfile = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser) {
      setUser(null)
      return
    }
    try {
      const profile = await getProfile(authUser.id)
      if (profile) {
        setUser({ ...authUser, ...profile } as User)
      } else {
        setUser({ ...authUser } as User)
      }
    } catch (err) {
      // If profile fetch fails, still set a minimal auth user so app isn't blocked
      // eslint-disable-next-line no-console
      console.warn('fetchUserProfile failed, using auth-only user', err)
      setUser({ ...authUser } as User)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let subscription: any = null

    const init = async () => {
      try {
        // Initial session check
        const res = await supabase.auth.getSession()
        const session = (res as any)?.data?.session
        if (session?.user && mounted) {
          await fetchUserProfile(session.user)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Initial auth session check failed', err)
      } finally {
        if (mounted) setLoading(false)
      }

      try {
        const onAuth = supabase.auth.onAuthStateChange((event: string, session: any) => {
          // React to auth events
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) fetchUserProfile(session.user)
          } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setUser(null)
          }
        })
        subscription = (onAuth as any).data?.subscription || (onAuth as any)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to subscribe to auth state changes', err)
      }
    }

    init()

    return () => {
      mounted = false
      try {
        if (subscription?.unsubscribe) subscription.unsubscribe()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to unsubscribe auth listener', err)
      }
    }
  }, [fetchUserProfile])

  // Simple wrappers around supabase auth
  const login = useCallback(async (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for login.')
    if (!navigator.onLine) throw new Error('Sem conexão de rede')
    const res = await supabase.auth.signInWithPassword({ email, password })
    if ((res as any).error) throw (res as any).error
    const session = (res as any)?.data?.session
    if (session?.user) {
      await fetchUserProfile(session.user)
    }
    return res
  }, [fetchUserProfile])

  const signup = useCallback(async (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for signup.')
    if (!navigator.onLine) throw new Error('Sem conexão de rede')
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: email.split('@')[0] } },
    })
    if ((res as any).error) throw (res as any).error
    const user = (res as any)?.data?.user
    if (user) {
      try {
        await updateProfile(user.id, { display_name: user.user_metadata?.display_name || '' })
        await fetchUserProfile(user as AuthUser)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error creating profile after signup', err)
      }
    }
    return res
  }, [fetchUserProfile])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Logout failed', err)
    }
  }, [])

  const updateUserProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) throw new Error('User not authenticated')
    const updatedProfileData = await updateProfile(user.id, updates)
    if (updatedProfileData) {
      setUser((prev) => (prev ? { ...prev, ...updatedProfileData } : prev))
    }
  }, [user])

  return { user, loading, login, signup, logout, updateUserProfile }
}
