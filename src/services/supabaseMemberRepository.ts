import { SupabaseClient } from '@supabase/supabase-js';
import { isValidHouseholdCode, normalizeHouseholdCode } from '../domain/household';
import { Member, MemberError, normalizeMemberName, sortMembers } from '../domain/member';
import { MemberRepository } from './memberRepository';

interface MemberRow { id: string; household_code: string; name: string; created_at: string }

function household(code: string): string {
  if (!isValidHouseholdCode(code)) throw new MemberError('invalid-household', 'Mã nhà không hợp lệ.');
  return normalizeHouseholdCode(code);
}

function member(row: MemberRow): Member {
  return { id: row.id, householdCode: row.household_code, name: row.name, createdAt: row.created_at };
}

function failure(error: { code?: string; message: string }): MemberError {
  if (error.code === '23505') return new MemberError('duplicate-name', 'Tên này đã có trong Gia đình. Hãy chọn Thành viên đó.');
  if (error.code === '23514') return new MemberError('invalid-name', 'Tên hoặc Mã nhà không hợp lệ. Nhập tên từ 1 đến 30 ký tự.');
  return new MemberError('unavailable', `Không thể kết nối database hoặc thiếu quyền. Hãy thử lại. (${error.message})`);
}

export class SupabaseMemberRepository implements MemberRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getMembers(householdCode: string): Promise<Member[]> {
    const code = household(householdCode);
    const { data, error } = await this.client.from('member').select('*').eq('household_code', code)
      .order('created_at', { ascending: true }).order('id', { ascending: true });
    if (error) throw failure(error);
    return sortMembers((data || []).map(member));
  }

  async addMember(householdCode: string, name: string): Promise<Member> {
    const code = household(householdCode);
    const clean = normalizeMemberName(name);
    const { data, error } = await this.client.from('member').insert({ household_code: code, name: clean }).select('*').single();
    if (error) throw failure(error);
    if (!data) throw new MemberError('unavailable', 'Database chưa xác nhận lưu Thành viên. Hãy thử lại.');
    return member(data);
  }

  async deleteMember(householdCode: string, id: string): Promise<void> {
    const code = household(householdCode);
    const { data, error } = await this.client.from('member').delete().eq('household_code', code).eq('id', id).select('id');
    if (error) throw failure(error);
    if (!data?.some(row => row.id === id)) {
      throw new MemberError('unavailable', 'Database chưa xác nhận xóa Thành viên. Thành viên có thể đã bị xóa hoặc bạn thiếu quyền. Hãy tải lại danh sách.');
    }
  }

  subscribe(householdCode: string, callback: () => void): () => void {
    const code = household(householdCode);
    let active = true;
    const notify = () => { if (active) callback(); };
    const channel = this.client.channel(`members_${code}_${crypto.randomUUID()}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'member', filter: `household_code=eq.${code}` }, notify)
      // DELETE old rows under RLS may contain only the primary key. Never rely on
      // household_code in that payload; use the event only to reload this Gia đình.
      // https://supabase.com/docs/guides/realtime/postgres-changes#delete-events
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'member' }, notify)
      .subscribe(status => { if (status === 'SUBSCRIBED') notify(); });

    // Recover missed changes across dropped sockets, sleeping devices, and reconnects.
    const timer = setInterval(notify, 15000);
    const foreground = () => { if (document.visibilityState === 'visible') notify(); };
    if (typeof window !== 'undefined') window.addEventListener('online', notify);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', foreground);
    return () => {
      active = false;
      clearInterval(timer);
      if (typeof window !== 'undefined') window.removeEventListener('online', notify);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', foreground);
      void this.client.removeChannel(channel);
    };
  }
}
