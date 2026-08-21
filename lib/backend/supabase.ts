import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { backendAnonKey, backendConfigured, backendUrl } from './config';

let client: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!backendConfigured()) return null;
  if (!client) {
    client = createClient(backendUrl(), backendAnonKey(), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Catalog/jobs for everyone: guest, email, Google. Never send a user JWT. */
export function getPublicSupabase(): SupabaseClient | null {
  if (!backendConfigured()) return null;
  if (!publicClient) {
    publicClient = createClient(backendUrl(), backendAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return publicClient;
}
