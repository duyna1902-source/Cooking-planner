import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDishRepository,
  createPlanRepository,
  resolveRepositories,
} from '../../src/services/repositoryFactory';
import { SupabaseDishRepository } from '../../src/services/supabaseDishRepository';
import { SupabasePlanRepository } from '../../src/services/supabasePlanRepository';
import { LocalStorageDishRepository } from '../../src/services/dishRepository';
import { LocalStoragePlanRepository } from '../../src/services/planRepository';
import { setSupabaseClientForTesting } from '../../src/services/supabaseClient';

describe('Dual Mode Repository Factory', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    setSupabaseClientForTesting(null);
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
    setSupabaseClientForTesting(null);
  });

  it('creates LocalStorage repositories when Supabase is not configured', () => {
    // @ts-expect-error test env override
    import.meta.env.VITE_SUPABASE_URL = '';
    // @ts-expect-error test env override
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';

    const dishRepo = createDishRepository();
    const planRepo = createPlanRepository();

    expect(dishRepo).toBeInstanceOf(LocalStorageDishRepository);
    expect(planRepo).toBeInstanceOf(LocalStoragePlanRepository);
  });

  it('creates Supabase repositories when Supabase client is configured', () => {
    const mockClient = { from: vi.fn(), channel: vi.fn() } as any;
    setSupabaseClientForTesting(mockClient);

    const dishRepo = createDishRepository();
    const planRepo = createPlanRepository();

    expect(dishRepo).toBeInstanceOf(SupabaseDishRepository);
    expect(planRepo).toBeInstanceOf(SupabasePlanRepository);
  });

  it('resolveRepositories returns repositories and online status flag', () => {
    const mockClient = { from: vi.fn(), channel: vi.fn() } as any;
    setSupabaseClientForTesting(mockClient);

    const result = resolveRepositories();
    expect(result.isOnline).toBe(true);
    expect(result.dishRepository).toBeInstanceOf(SupabaseDishRepository);
    expect(result.planRepository).toBeInstanceOf(SupabasePlanRepository);

    setSupabaseClientForTesting(null);
    // @ts-expect-error test env override
    import.meta.env.VITE_SUPABASE_URL = '';
    // @ts-expect-error test env override
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';

    const localResult = resolveRepositories();
    expect(localResult.isOnline).toBe(false);
    expect(localResult.dishRepository).toBeInstanceOf(LocalStorageDishRepository);
    expect(localResult.planRepository).toBeInstanceOf(LocalStoragePlanRepository);
  });
});
