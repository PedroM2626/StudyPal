// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || undefined
const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
) || undefined

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
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
} else {
  // Provide a fail-fast proxy so importing modules don't crash during initialization.
  // Any attempt to use the client will throw a helpful error.
  const handler: ProxyHandler<any> = {
    get() {
      throw missingEnvError()
    },
    apply() {
      throw missingEnvError()
    },
    construct() {
      throw missingEnvError()
    },
  }
  // Export a proxy that matches the shape of a Supabase client for runtime safety.
  // Consumers will receive a clear error when they attempt to use it.
  supabaseClient = new Proxy(function () {}, handler) as unknown as SupabaseClient<Database>
}

export const supabase = supabaseClient as SupabaseClient<Database>
