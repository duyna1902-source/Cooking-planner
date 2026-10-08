import { SupabaseClient } from '@supabase/supabase-js';
import {
  PlanItem,
  MealType,
  PlanComment,
  createPlanItemEntity,
  createPlanCommentEntity,
  validateCommentInput,
  getRetentionThresholdDate,
} from '../domain/plan';
import { PlanRepository } from './planRepository';

export interface PlanItemRow {
  id: string;
  household_code: string;
  date: string;
  meal_type: string;
  dish_id: string;
  created_at: string;
}

export interface PlanCommentRow {
  id: string;
  household_code: string;
  plan_item_id: string;
  author_nickname: string;
  content: string;
  created_at: string;
}

export function mapPlanItemRowToEntity(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    householdCode: row.household_code,
    date: row.date,
    mealType: row.meal_type as MealType,
    dishId: row.dish_id,
    createdAt: row.created_at,
  };
}

export function mapCommentRowToEntity(row: PlanCommentRow): PlanComment {
  return {
    id: row.id,
    householdCode: row.household_code,
    planItemId: row.plan_item_id,
    authorName: row.author_nickname,
    content: row.content,
    createdAt: row.created_at,
  };
}

export class SupabasePlanRepository implements PlanRepository {
  readonly isOnline = true;
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getPlanItems(
    householdCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<PlanItem[]> {
    let query = this.client
      .from('plan_items')
      .select('*')
      .eq('household_code', householdCode);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      throw new Error(`Lỗi tải Kế hoạch: ${error.message}`);
    }

    return (data || []).map(mapPlanItemRowToEntity);
  }

  async addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]> {
    if (!dishIds || dishIds.length === 0) {
      return [];
    }

    // Check existing dishes in the target slot to avoid duplicates
    const { data: existingRows, error: checkError } = await this.client
      .from('plan_items')
      .select('dish_id')
      .eq('household_code', householdCode)
      .eq('date', date)
      .eq('meal_type', mealType);

    if (checkError) {
      throw new Error(`Lỗi kiểm tra Món ăn trong bữa ăn: ${checkError.message}`);
    }

    const existingDishIds = new Set((existingRows || []).map((r: any) => r.dish_id));
    const dishesToAdd = dishIds.filter((dishId) => !existingDishIds.has(dishId));

    if (dishesToAdd.length === 0) {
      return [];
    }

    const newEntities = dishesToAdd.map((dishId) =>
      createPlanItemEntity(householdCode, date, mealType, dishId)
    );

    const rowsToInsert = newEntities.map((item) => ({
      id: item.id,
      household_code: item.householdCode,
      date: item.date,
      meal_type: item.mealType,
      dish_id: item.dishId,
      created_at: item.createdAt,
    }));

    const { error: insertError } = await this.client.from('plan_items').insert(rowsToInsert);

    if (insertError) {
      throw new Error(`Lỗi thêm Món ăn vào Kế hoạch: ${insertError.message}`);
    }

    return newEntities;
  }

  async removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void> {
    const { error } = await this.client
      .from('plan_items')
      .delete()
      .eq('household_code', householdCode)
      .eq('date', date)
      .eq('meal_type', mealType)
      .eq('dish_id', dishId);

    if (error) {
      throw new Error(`Lỗi gỡ Món ăn khỏi bữa ăn: ${error.message}`);
    }
  }

  async deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void> {
    const { error } = await this.client
      .from('plan_items')
      .delete()
      .eq('household_code', householdCode)
      .eq('dish_id', dishId);

    if (error) {
      throw new Error(`Lỗi xóa Món ăn khỏi Kế hoạch: ${error.message}`);
    }
  }

  async getComments(householdCode: string, planItemId: string): Promise<PlanComment[]> {
    const { data, error } = await this.client
      .from('plan_comments')
      .select('*')
      .eq('household_code', householdCode)
      .eq('plan_item_id', planItemId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Lỗi tải dặn dò: ${error.message}`);
    }

    return (data || []).map(mapCommentRowToEntity);
  }

  async addComment(
    householdCode: string,
    planItemId: string,
    authorName: string,
    content: string
  ): Promise<PlanComment> {
    const validation = validateCommentInput({
      householdCode,
      planItemId,
      authorName,
      content,
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const comment = createPlanCommentEntity(householdCode, planItemId, authorName, content);

    const { error } = await this.client.from('plan_comments').insert({
      id: comment.id,
      household_code: comment.householdCode,
      plan_item_id: comment.planItemId,
      author_nickname: comment.authorName,
      content: comment.content,
      created_at: comment.createdAt,
    });

    if (error) {
      throw new Error(`Lỗi gửi dặn dò: ${error.message}`);
    }

    return comment;
  }

  async deleteCommentsByPlanItemId(householdCode: string, planItemId: string): Promise<void> {
    const { error } = await this.client
      .from('plan_comments')
      .delete()
      .eq('household_code', householdCode)
      .eq('plan_item_id', planItemId);

    if (error) {
      throw new Error(`Lỗi xóa dặn dò: ${error.message}`);
    }
  }

  async pruneOldHistory(
    householdCode: string,
    basePlanningDate: string
  ): Promise<{ prunedCount: number }> {
    const thresholdDate = getRetentionThresholdDate(basePlanningDate);

    const { data: expired, error: countError } = await this.client
      .from('plan_items')
      .select('id')
      .eq('household_code', householdCode)
      .lt('date', thresholdDate);

    if (countError) {
      return { prunedCount: 0 };
    }

    const prunedCount = (expired || []).length;
    if (prunedCount > 0) {
      await this.client
        .from('plan_items')
        .delete()
        .eq('household_code', householdCode)
        .lt('date', thresholdDate);
    }

    return { prunedCount };
  }

  subscribe(householdCode: string, callback: () => void): () => void {
    const channelName = `plan_realtime_${householdCode}_${Date.now()}`;
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
          table: 'plan_items',
          filter: `household_code=eq.${householdCode}`,
        },
        () => {
          callback();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_comments',
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
