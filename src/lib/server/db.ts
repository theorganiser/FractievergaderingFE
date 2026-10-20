import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../supabaseAdmin'

// Ongetypeerde service-role client (we hebben geen gegenereerde database-types).
// Alleen importeren in API-routes (server-side).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = () => getSupabaseAdmin() as unknown as SupabaseClient<any, 'public', any>
