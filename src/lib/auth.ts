import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getProfile, updateProfile, Profile } from '@/services/profile'
import { AuthUser } from '@supabase/supabase-js'

export type User = AuthUser & Profile

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  // Loading state removed because it caused issues when switching tabs.
  const loading = false

  const lastActiveSessionRef = useRef<{ session: any; ts: number } | null>(null)

  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    try {
      const profile = await getProfile(authUser.id)
      if (profile) {
        const merged = { ...authUser, ...profile } as User
        setUser(merged)
        lastActiveSessionRef.current = { session: authUser, ts: Date.now() }
      } else {
        // This case might happen for a brand new user, handle appropriately
        setUser({ ...authUser } as User)
        lastActiveSessionRef.current = { session: authUser, ts: Date.now() }
      }
    } catch (err) {
      // On error, ensure user is at least set from authUser to avoid blocking flow
      // eslint-disable-next-line no-console
      console.error('fetchUserProfile error', err)
      setUser({ ...authUser } as User)
      lastActiveSessionRef.current = { session: authUser, ts: Date.now() }
    }
  }, [])

  useEffect(() => {
    let subscriptionUnsubscribe: (() => void) | null = null

    const setup = async () => {
      try {
        const onAuth = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              // debug: log auth event and session
              // eslint-disable-next-line no-console
              console.debug('onAuth event', event, session)
              setLoadingWithWatchdog(true)
              if (session?.user) {
                await fetchUserProfile(session.user)
              } else {
                const last = lastActiveSessionRef.current
                const now = Date.now()
                if (last && now - last.ts < 5000) {
                  // keep existing user during brief token refreshes
                  // eslint-disable-next-line no-console
                  console.debug('Skipping transient sign-out (recent session)')
                } else {
                  // eslint-disable-next-line no-console
                  console.debug('Clearing user due to missing session')
                  setUser(null)
                }
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('onAuthStateChange handler error', err)
            } finally {
              setLoadingWithWatchdog(false)
            }
          },
        )

        // onAuth may return an object with data.subscription
        if (onAuth && (onAuth as any).data?.subscription) {
          subscriptionUnsubscribe = () =>
            (onAuth as any).data.subscription.unsubscribe()
        } else if (
          onAuth &&
          typeof (onAuth as any).unsubscribe === 'function'
        ) {
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
        // eslint-disable-next-line no-console
        console.debug('getSession initial check', res)
        const session = (res as any)?.data?.session
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          // eslint-disable-next-line no-console
          console.debug('No session on initial check', session)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('checkSession error', err)
      } finally {
        setLoadingWithWatchdog(false)
      }
    }

    (async () => {
      try {
        await setup()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error during auth setup', err)
      } finally {
        // ensure loading is not stuck
        setLoadingWithWatchdog(false)
      }
    })()

    const handleVisibilityOrFocus = async () => {
      try {
        // Re-check session on tab focus/visibility to ensure auth state stays in sync
        const res = await supabase.auth.getSession()
        // eslint-disable-next-line no-console
        console.debug('getSession visibility/focus check', res)
        const session = (res as any)?.data?.session
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          const last = lastActiveSessionRef.current
          const now = Date.now()
          if (last && now - last.ts < 5000) {
            // eslint-disable-next-line no-console
            console.debug('Skipping transient sign-out (recent session)')
          } else {
            setUser(null)
          }
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

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for login.')
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.error) throw res.error
    const session = (res as any)?.data?.session
    if (session?.user) {
      try {
        await fetchUserProfile(session.user)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching profile after login', err)
      }
    }
    return res
  }

  const signup = async (email: string, password?: string) => {
    if (!password) throw new Error('Password is required for signup.')
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split('@')[0],
        },
      },
    })
    if (res.error) throw res.error
    const user = (res as any)?.data?.user
    if (user) {
      try {
        // create an initial profile row
        await updateProfile(user.id, {
          display_name: user.user_metadata?.display_name || '',
        })
        await fetchUserProfile(user)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error during signup profile creation', err)
      }
    }
    return res
  }

  const logout = () => supabase.auth.signOut()

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('User not authenticated')
    const updatedProfileData = await updateProfile(user.id, updates)
    if (updatedProfileData) {
      // Atualiza o estado imediatamente com os novos dados
      const updatedUser = { ...user, ...updatedProfileData }
      setUser(updatedUser)
    }
  }

  return { user, loading, login, signup, logout, updateUserProfile }
}
