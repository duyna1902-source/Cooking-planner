import { SupabaseClient } from '@supabase/supabase-js';
import { Member, isValidMemberName, createMemberEntity } from '../domain/member';
import { MemberRepository } from './memberRepository';

export interface MemberRow {
  id: string;
  household_code: string;
  name: string;
  avatar_icon: string;
  avatar_color: string;
  created_at: string;
}

export function mapMemberRowToEntity(row: MemberRow): Member {
  return {
    id: row.id,
    householdCode: row.household_code,
    name: row.name,
    avatarIcon: row.avatar_icon,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}

export class SupabaseMemberRepository implements MemberRepository {
  readonly isOnline = true;
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getMembers(householdCode: string): Promise<Member[]> {
    const { data, error } = await this.client
      .from('members')
      .select('*')
      .eq('household_code', householdCode)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Lỗi tải danh sách Thành viên: ${error.message}`);
    }

    return (data || []).map(mapMemberRowToEntity);
  }

  async addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    if (!isValidMemberName(member.name)) {
      throw new Error('Tên thành viên không hợp lệ');
    }

    const newMember = createMemberEntity(member.householdCode, {
      name: member.name,
      avatarIcon: member.avatarIcon,
      avatarColor: member.avatarColor,
    });

    const { error } = await this.client.from('members').insert({
      id: newMember.id,
      household_code: newMember.householdCode,
      name: newMember.name,
      avatar_icon: newMember.avatarIcon,
      avatar_color: newMember.avatarColor,
      created_at: newMember.createdAt,
    });

    if (error) {
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique') ||
        error.message?.toLowerCase().includes('duplicate')
      ) {
        throw new Error('Tên thành viên đã tồn tại');
      }
      throw new Error(`Lỗi thêm Thành viên: ${error.message}`);
    }

    return newMember;
  }

  async updateMember(
    id: string,
    updates: Partial<Pick<Member, 'name' | 'avatarIcon' | 'avatarColor'>>
  ): Promise<Member> {
    const patch: Record<string, any> = {};

    if (updates.name !== undefined) {
      if (!isValidMemberName(updates.name)) {
        throw new Error('Tên thành viên không hợp lệ');
      }
      patch.name = updates.name.trim();
    }
    if (updates.avatarIcon !== undefined) {
      patch.avatar_icon = updates.avatarIcon;
    }
    if (updates.avatarColor !== undefined) {
      patch.avatar_color = updates.avatarColor;
    }

    const { data, error } = await this.client
      .from('members')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      if (
        error?.code === '23505' ||
        error?.message?.toLowerCase().includes('unique') ||
        error?.message?.toLowerCase().includes('duplicate')
      ) {
        throw new Error('Tên thành viên đã tồn tại');
      }
      throw new Error(`Lỗi cập nhật Thành viên: ${error?.message || 'Thành viên không tồn tại'}`);
    }

    return mapMemberRowToEntity(data);
  }

  async deleteMember(id: string, householdCode: string): Promise<void> {
    const { error } = await this.client
      .from('members')
      .delete()
      .eq('household_code', householdCode)
      .eq('id', id);

    if (error) {
      throw new Error(`Lỗi xóa Thành viên: ${error.message}`);
    }
  }

  subscribe(householdCode: string, onUpdate: () => void): () => void {
    const channelName = `members_realtime_${householdCode}_${Date.now()}`;
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
          table: 'members',
          filter: `household_code=eq.${householdCode}`,
        },
        () => {
          onUpdate();
        }
      )
      ?.subscribe?.();

    return () => {
      this.client?.removeChannel?.(channel);
    };
  }
}
