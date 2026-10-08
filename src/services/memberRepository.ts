import { Member } from '../domain/member';

export interface MemberRepository {
  getMembers(householdCode: string): Promise<Member[]>;
  addMember(householdCode: string, name: string): Promise<Member>;
  deleteMember(householdCode: string, id: string): Promise<void>;
  subscribe(householdCode: string, callback: () => void): () => void;
}

export class UnavailableMemberRepository implements MemberRepository {
  async getMembers(): Promise<Member[]> {
    throw new Error('Chưa kết nối database. Vui lòng kiểm tra cấu hình và thử lại.');
  }
  async addMember(): Promise<Member> { throw new Error('Chưa kết nối database. Vui lòng thử lại.'); }
  async deleteMember(): Promise<void> { throw new Error('Chưa kết nối database. Vui lòng thử lại.'); }
  subscribe(): () => void { return () => {}; }
}
