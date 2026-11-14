import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_EVENT_ID } from '@/data/demo';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || DEFAULT_EVENT_ID;
export const isDemoMode = !url || !anonKey;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (isDemoMode) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
