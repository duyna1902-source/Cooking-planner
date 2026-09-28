import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  createSupabaseClient,
  getSupabaseClient,
  setSupabaseClientForTesting,
} from '../../src/services/supabaseClient';

describe('supabaseClient service', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    setSupabaseClientForTesting(null);
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
    setSupabaseClientForTesting(null);
  });

  describe('isSupabaseConfigured', () => {
    it('returns false when environment variables are undefined or empty', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = '';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns false when only URL is provided', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = 'https://xyzcompany.supabase.co';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns false when values are placeholder strings', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = 'https://your-project.supabase.co';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'your-anon-key';

      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns true when both URL and Key are valid non-placeholder strings', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = 'https://abc123xyz.supabase.co';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe('getSupabaseConfig', () => {
    it('returns null when unconfigured', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = '';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      expect(getSupabaseConfig()).toBeNull();
    });

    it('returns url and anonKey when valid', () => {
      const url = 'https://realproject.supabase.co';
      const key = 'real-anon-key-12345';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = url;
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = key;

      expect(getSupabaseConfig()).toEqual({
        url,
        anonKey: key,
      });
    });
  });

  describe('createSupabaseClient & getSupabaseClient', () => {
    it('returns null when config is missing and no client is forced', () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = '';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      expect(getSupabaseClient()).toBeNull();
    });

    it('allows injecting a test mock client', () => {
      const mockClient = { from: vi.fn(), channel: vi.fn() } as any;
      setSupabaseClientForTesting(mockClient);

      expect(getSupabaseClient()).toBe(mockClient);
    });
  });
});
