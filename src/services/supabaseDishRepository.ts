import { SupabaseClient } from '@supabase/supabase-js';
import { Dish, DishInput, createDishEntity, validateDishInput } from '../domain/dish';
import { DishRepository } from './dishRepository';
import { PlanRepository } from './planRepository';

export interface DishRow {
  id: string;
  household_code: string;
  name: string;
  tag?: string | null;
  created_at: string;
}

export function mapDishRowToEntity(row: DishRow): Dish {
  return {
    id: row.id,
    householdCode: row.household_code,
    name: row.name,
    tag: row.tag || undefined,
    createdAt: row.created_at,
  };
}

export class SupabaseDishRepository implements DishRepository {
  private client: SupabaseClient;
  private planRepository?: PlanRepository;

  constructor(client: SupabaseClient, planRepository?: PlanRepository) {
    this.client = client;
    this.planRepository = planRepository;
  }

  setPlanRepository(planRepository: PlanRepository): void {
    this.planRepository = planRepository;
  }

  async getDishes(householdCode: string): Promise<Dish[]> {
    const { data, error } = await this.client
      .from('dishes')
      .select('*')
      .eq('household_code', householdCode)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Lỗi tải danh sách Món ăn: ${error.message}`);
    }

    return (data || []).map(mapDishRowToEntity);
  }

  async addDish(householdCode: string, input: DishInput): Promise<Dish> {
    const dish = createDishEntity(householdCode, input);
    const { error } = await this.client.from('dishes').insert({
      id: dish.id,
      household_code: dish.householdCode,
      name: dish.name,
      tag: dish.tag || null,
      created_at: dish.createdAt,
    });

    if (error) {
      throw new Error(`Lỗi thêm Món ăn: ${error.message}`);
    }

    return dish;
  }

  async updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish> {
    const validation = validateDishInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { data, error } = await this.client
      .from('dishes')
      .update({
        name: input.name.trim(),
        tag: input.tag ? input.tag.trim() : null,
      })
      .eq('household_code', householdCode)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Lỗi cập nhật Món ăn: ${error?.message || 'Món ăn không tồn tại'}`);
    }

    return mapDishRowToEntity(data);
  }

  async deleteDish(householdCode: string, id: string): Promise<void> {
    const { error } = await this.client
      .from('dishes')
      .delete()
      .eq('household_code', householdCode)
      .eq('id', id);

    if (error) {
      throw new Error(`Lỗi xóa Món ăn: ${error.message}`);
    }

    if (this.planRepository) {
      await this.planRepository.deletePlanItemsByDishId(householdCode, id);
    }
  }

  subscribe(householdCode: string, callback: () => void): () => void {
    const channelName = `dishes_realtime_${householdCode}_${Date.now()}`;
    const channel = this.client?.channel?.(channelName);
    if (!channel || typeof channel.on !== 'function') {
      return () => {};
    }

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dishes',
          filter: `household_code=eq.${householdCode}`,
        },
        () => {
          callback();
        }
      )
      ?.subscribe?.();

    return () => {
      this.client?.removeChannel?.(channel);
    };
  }
}
