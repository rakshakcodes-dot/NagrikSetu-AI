import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawUrl &&
    rawKey &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('your-project-id') &&
    rawKey !== 'your-supabase-anon-key'
  );
};

// Provide a valid mock URL/key for client instantiation if not yet configured
// to prevent runtime throw, while isSupabaseConfigured() safely guards DB calls
const supabaseUrl = isSupabaseConfigured()
  ? rawUrl
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured()
  ? rawKey
  : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseHealth {
  configured: boolean;
  connected: boolean;
  message: string;
  url?: string;
}

export async function testSupabaseConnection(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase environment variables not configured. Running in Local Demo Mode.',
    };
  }

  try {
    const { count, error } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, it's still configured but schema needs running
      if (error.code === '42P01' || error.message.includes('relation "public.complaints" does not exist')) {
        return {
          configured: true,
          connected: true,
          url: rawUrl,
          message: 'Connected to Supabase project! Schema tables need to be created using supabase-schema.sql.',
        };
      }
      return {
        configured: true,
        connected: false,
        url: rawUrl,
        message: `Supabase query error: ${error.message}`,
      };
    }

    return {
      configured: true,
      connected: true,
      url: rawUrl,
      message: `Connected to Supabase PostgreSQL DB! (${count ?? 0} complaints in DB)`,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: rawUrl,
      message: `Connection failed: ${err?.message || 'Network error'}`,
    };
  }
}
