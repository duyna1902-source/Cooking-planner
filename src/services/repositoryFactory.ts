import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { DishRepository, LocalStorageDishRepository } from './dishRepository';
import { PlanRepository, LocalStoragePlanRepository } from './planRepository';
import { SupabaseDishRepository } from './supabaseDishRepository';
import { SupabasePlanRepository } from './supabasePlanRepository';

export function createPlanRepository(client?: SupabaseClient | null): PlanRepository {
  const sbClient = client !== undefined ? client : getSupabaseClient();
  if (sbClient) {
    return new SupabasePlanRepository(sbClient);
  }
  return new LocalStoragePlanRepository();
}

export function createDishRepository(
  client?: SupabaseClient | null,
  planRepo?: PlanRepository
): DishRepository {
  const sbClient = client !== undefined ? client : getSupabaseClient();
  if (sbClient) {
    return new SupabaseDishRepository(sbClient, planRepo);
  }
  return new LocalStorageDishRepository(planRepo);
}

export interface ResolvedRepositories {
  dishRepository: DishRepository;
  planRepository: PlanRepository;
  isOnline: boolean;
}

export function resolveRepositories(client?: SupabaseClient | null): ResolvedRepositories {
  const sbClient = client !== undefined ? client : getSupabaseClient();
  const online = sbClient !== null && (client !== undefined ? true : isSupabaseConfigured());

  const planRepository = createPlanRepository(sbClient);
  const dishRepository = createDishRepository(sbClient, planRepository);

  return {
    dishRepository,
    planRepository,
    isOnline: online,
  };
}
