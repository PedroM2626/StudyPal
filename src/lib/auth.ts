import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getProfile, updateProfile, Profile } from '@/services/profile'
import { AuthUser } from '@supabase/supabase-js'

export type User = AuthUser & Profile

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingTimerRef = useRef<number | null>(null)

  const setLoadingWithWatchdog = (value: boolean) => {
    setLoading(value)
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = null
    }
    if (value) {
      // safety: ensure loading doesn't stay true forever
      loadingTimerRef.current = window.setTimeout(() => {
        // eslint-disable-next-line no-console
        console.warn('Auth loading watchdog cleared loading state')
        setLoading(false)
        loadingTimerRef.current = null
      }, 8000)
    }
  }

  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    try {
      const profile = await getProfile(authUser.id)
      if (profile) {
        setUser({ ...authUser, ...profile })
      } else {
        // This case might happen for a brand new user, handle appropriately
        setUser({ ...authUser } as User)
      }
    } catch (err) {
      // On error, ensure user is at least set from authUser to avoid blocking flow
      // eslint-disable-next-line no-console
      console.error('fetchUserProfile error', err)
      setUser({ ...authUser } as User)
    }
  }, [])

  useEffect(() => {
    let subscriptionUnsubscribe: (() => void) | null = null

    const setup = async () => {
      try {
        const onAuth = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            setLoadingWithWatchdog(true)
            if (session?.user) {
              await fetchUserProfile(session.user)
            } else {
              setUser(null)
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('onAuthStateChange handler error', err)
          } finally {
            setLoadingWithWatchdog(false)
          }
        })

        // onAuth may return an object with data.subscription
        if (onAuth && (onAuth as any).data?.subscription) {
          subscriptionUnsubscribe = () => (onAuth as any).data.subscription.unsubscribe()
        } else if (onAuth && typeof (onAuth as any).unsubscribe === 'function') {
          // older shape
          subscriptionUnsubscribe = () => (onAuth as any).unsubscribe()
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize auth subscription', err)
      }

      // Initial check
      try {
        setLoadingWithWatchdog(true)
        const res = await supabase.auth.getSession()
        const session = (res as any)?.data?.session
        if (session?.user) {
          await fetchUserProfile(session.user)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('checkSession error', err)
      } finally {
        setLoadingWithWatchdog(false)
      }
    }

    setup()

    const handleVisibilityOrFocus = async () => {
      try {
        // Re-check session on tab focus/visibility to ensure auth state stays in sync
        const res = await supabase.auth.getSession()
        const session = (res as any)?.data?.session
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('visibility/focus check error', err)
      } finally {
        // ensure loading isn't left true
        setLoadingWithWatchdog(false)
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    return () => {
      try {
        if (subscriptionUnsubscribe) subscriptionUnsubscribe()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to unsubscribe auth listener', err)
      }
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
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
