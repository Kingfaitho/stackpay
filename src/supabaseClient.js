import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const MISSING_MSG = 'Missing Supabase env variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'

// Helper to create a chainable builder that resolves to a clear error result.
const makeErrorResult = (msg) => ({ data: null, error: new Error(msg) })
const makeBuilder = (msg) => {
  const result = makeErrorResult(msg)
  const builder = {
    select: () => builder,
    single: async () => result,
    insert: async () => result,
    upsert: async () => result,
    update: () => builder,
    eq: async () => result,
    delete: async () => result,
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  }
  return builder
}

// If envs are present, export a real client. Otherwise export a safe stub with
// developer-friendly error responses so the app doesn't crash at import time.
if (supabaseUrl && supabaseAnonKey) {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error('Supabase not configured:', MISSING_MSG)
  const stub = {
    auth: {
      // mimic getSession -> resolves with { data: { session: null } }
      getSession: async () => ({ data: { session: null } }),
      // onAuthStateChange should return { data: { subscription } }
      onAuthStateChange: (_handler) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ data: null, error: new Error(MISSING_MSG) }),
      signInWithPassword: async () => ({ data: null, error: new Error(MISSING_MSG) }),
      signOut: async () => ({ error: new Error(MISSING_MSG) }),
    },
    from: (_table) => makeBuilder(MISSING_MSG),
  }
  export const supabase = stub
}

