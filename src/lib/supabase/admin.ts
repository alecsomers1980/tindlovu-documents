// Server-only — never import from client code.
// Uses the service-role key which bypasses Row Level Security.

import { createClient } from '@supabase/supabase-js'

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
