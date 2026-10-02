import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { DishRepository, LocalStorageDishRepository } from './dishRepository';
import { PlanRepository, LocalStoragePlanRepository } from './planRepository';
import { HouseholdRepository, LocalStorageHouseholdRepository } from './householdRepository';
import { SupabaseDishRepository } from './supabaseDishRepository';
import { SupabasePlanRepository } from './supabasePlanRepository';
import { SupabaseHouseholdRepository } from './supabaseHouseholdRepository';

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

export function createHouseholdRepository(client?: SupabaseClient | null): HouseholdRepository {
  const sbClient = client !== undefined ? client : getSupabaseClient();
  if (sbClient) {
    return new SupabaseHouseholdRepository(sbClient);
  }
  return new LocalStorageHouseholdRepository();
}

export interface ResolvedRepositories {
  dishRepository: DishRepository;
  planRepository: PlanRepository;
  householdRepository: HouseholdRepository;
  isOnline: boolean;
}

export function resolveRepositories(client?: SupabaseClient | null): ResolvedRepositories {
  const sbClient = client !== undefined ? client : getSupabaseClient();
  const online = sbClient !== null && (client !== undefined ? true : isSupabaseConfigured());

  const planRepository = createPlanRepository(sbClient);
  const dishRepository = createDishRepository(sbClient, planRepository);
  const householdRepository = createHouseholdRepository(sbClient);

  return {
    dishRepository,
    planRepository,
    householdRepository,
    isOnline: online,
  };
}
