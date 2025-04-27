import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
        storageKey: 'supabase-auth'
      },
      global: {
        headers: {
          // Enviar las cookies
          cookie: cookieStore.toString()
        }
      }
    }
  );
} 