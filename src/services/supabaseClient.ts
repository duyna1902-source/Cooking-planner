import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PLACEHOLDER_URLS = ['https://your-project.supabase.co', ''];
const PLACEHOLDER_KEYS = ['your-anon-key', ''];

let testingClient: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const env: Record<string, string | undefined> =
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const url = (env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    return null;
  }

  if (PLACEHOLDER_URLS.includes(url) || PLACEHOLDER_KEYS.includes(anonKey)) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  if (testingClient) {
    return true;
  }
  return getSupabaseConfig() !== null;
}

export function createSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const config = url && anonKey ? { url, anonKey } : getSupabaseConfig();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (testingClient) {
    return testingClient;
  }

  if (!cachedClient) {
    cachedClient = createSupabaseClient();
  }

  return cachedClient;
}

export function setSupabaseClientForTesting(client: SupabaseClient | null): void {
  testingClient = client;
  cachedClient = client;
}
