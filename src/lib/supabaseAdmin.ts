import { createClient } from '@supabase/supabase-js'

// ALLEEN voor gebruik in API-routes (server-side). Nooit importeren in
// client components — de service-role key mag nooit naar de browser.
// Lazy aangemaakt: zo faalt een build niet als de env var nog niet gezet is,
// en krijg je pas bij een echte aanroep een duidelijke foutmelding.
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (client) return client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY (of NEXT_PUBLIC_SUPABASE_URL) ontbreekt.')
  }
  client = createClient(supabaseUrl, serviceRoleKey)
  return client
}
