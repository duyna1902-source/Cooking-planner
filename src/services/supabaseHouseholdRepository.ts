import { SupabaseClient } from '@supabase/supabase-js';
import {
  Household,
  createHouseholdEntity,
  addMemberToHousehold,
  normalizeHouseholdCode,
} from '../domain/household';
import { HouseholdRepository } from './householdRepository';

export interface HouseholdRow {
  code: string;
  members: string[];
  created_at: string;
}

export function mapHouseholdRowToEntity(row: HouseholdRow): Household {
  return {
    code: row.code,
    members: Array.isArray(row.members) ? row.members : [],
    createdAt: row.created_at,
  };
}

export class SupabaseHouseholdRepository implements HouseholdRepository {
  readonly isOnline = true;
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getHousehold(code: string): Promise<Household | null> {
    const normalized = normalizeHouseholdCode(code);
    const { data, error } = await this.client
      .from('households')
      .select('*')
      .eq('code', normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Lỗi tải dữ liệu Nhà: ${error.message}`);
    }

    if (!data) return null;
    return mapHouseholdRowToEntity(data);
  }

  async saveHousehold(household: Household): Promise<Household> {
    const normalized = normalizeHouseholdCode(household.code);
    const row = {
      code: normalized,
      members: household.members,
      created_at: household.createdAt || new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('households')
      .upsert(row)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Lỗi lưu dữ liệu Nhà: ${error?.message || 'Không thành công'}`);
    }

    return mapHouseholdRowToEntity(data);
  }

  async getMembers(code: string): Promise<string[]> {
    const household = await this.getHousehold(code);
    return household ? [...household.members] : [];
  }

  async addMember(code: string, memberName: string): Promise<Household> {
    const normalized = normalizeHouseholdCode(code);
    let household = await this.getHousehold(normalized);
    if (!household) {
      household = createHouseholdEntity(normalized, [memberName]);
    } else {
      household = addMemberToHousehold(household, memberName);
    }
    return this.saveHousehold(household);
  }

  subscribe(code: string, callback: () => void): () => void {
    const normalized = normalizeHouseholdCode(code);
    const channelName = `households_realtime_${normalized}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channel = this.client?.channel?.(channelName);
    if (!channel || typeof channel.on !== 'function') {
      return () => {};
    }

    try {
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'households',
            filter: `code=eq.${normalized}`,
          },
          () => {
            callback();
          }
        )
        ?.subscribe?.();
    } catch {
      // Ignored if channel already subscribed
    }

    return () => {
      this.client?.removeChannel?.(channel);
    };
  }
}
