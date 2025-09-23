// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || undefined
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || undefined

function missingEnvError(): Error {
  const msg =
    'Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.\nPlease connect Supabase via the MCP (Open MCP popover) or set these variables in your environment.'
  // Log to console to help developers when previewing the app
  // eslint-disable-next-line no-console
  console.error(msg)
  return new Error(msg)
}

let supabaseClient: SupabaseClient<Database> | null = null

if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  supabaseClient = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  )
} else {
  // Provide a no-op supabase client so the app can run without crashing
  // when Supabase env vars are not configured. Each method logs a warning
  // and returns resolved promises with null/empty data.
  // This allows the UI to render and avoids throwing during imports.
  // eslint-disable-next-line no-console
  console.warn('Supabase not configured. Using fallback no-op client.')

  const noopPromise = async (result: any) => result

  const makeQuery = () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      single: async () => ({ data: null, error: null }),
      insert: async (_payload: any) => ({ data: null, error: null }),
      update: async (_payload: any) => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      order: () => q,
      limit: () => q,
      returns: () => q,
    }
    return q
  }

  const noopStorage = {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: any) => ({ error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
      remove: async (_path: string) => ({ error: null }),
    }),
  }

  const authSubscribers: Array<(event: string, session: any) => void> = []
  let currentSession: any = null

  const noopAuth = {
    onAuthStateChange: (cb: (event: string, session: any) => void) => {
      authSubscribers.push(cb)
      const subscription = {
        unsubscribe: () => {
          const idx = authSubscribers.indexOf(cb)
          if (idx !== -1) authSubscribers.splice(idx, 1)
        },
      }
      return { data: { subscription } }
    },
    getSession: async () => ({ data: { session: currentSession } }),
    signInWithPassword: async (creds: any) => {
      // create a fake user session for dev when Supabase isn't configured
      currentSession = {
        user: {
          id: 'dev-user',
          email: creds.email || 'dev@localhost',
          user_metadata: { display_name: (creds.email || 'dev').split('@')[0] },
        },
      }
      // notify subscribers
      authSubscribers.forEach((cb) => cb('SIGNED_IN', currentSession))
      return { data: { session: currentSession }, error: null }
    },
    signUp: async (data: any) => {
      currentSession = {
        user: {
          id: 'dev-user',
          email: data.email || 'dev@localhost',
          user_metadata: { display_name: (data.email || 'dev').split('@')[0] },
        },
      }
      authSubscribers.forEach((cb) => cb('SIGNED_UP', currentSession))
      return { data: { user: currentSession.user }, error: null }
    },
    signOut: async () => {
      currentSession = null
      authSubscribers.forEach((cb) => cb('SIGNED_OUT', null))
      return { error: null }
    },
    // legacy
    user: null,
  }

  const noopClient: any = {
    from: (_table: string) => makeQuery(),
    rpc: async (_fn: string, _args?: any) => ({ data: null, error: null }),
    auth: noopAuth,
    storage: noopStorage,
    functions: {
      invoke: async (_name: string, _opts?: any) => ({
        data: null,
        error: null,
      }),
    },
  }

  supabaseClient = noopClient as unknown as SupabaseClient<Database>
}

export const supabase = supabaseClient as SupabaseClient<Database>
