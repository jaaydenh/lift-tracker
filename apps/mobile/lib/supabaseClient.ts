import { createClient } from '@supabase/supabase-js';
import { secureStoreAdapter } from './secureStoreAdapter';

const environment =
  (globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process?.env ?? {};

const supabaseUrl = environment.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    flowType: 'pkce',
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
