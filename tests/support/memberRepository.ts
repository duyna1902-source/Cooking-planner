import { Member, sortMembers } from '../../src/domain/member';
import { MemberRepository } from '../../src/services/memberRepository';

// Shared database boundary for App tests; no production fallback uses this repository.
export class TestMemberRepository implements MemberRepository {
  private members: Member[];
  private nextId = 1;
  private listeners = new Map<string, Set<() => void>>();
  constructor(members: Member[] = []) { this.members = members.map(member => ({ ...member })); }
  async getMembers(code: string): Promise<Member[]> {
    return sortMembers(this.members.filter(member => member.householdCode === code).map(member => ({ ...member })));
  }
  async addMember(code: string, name: string): Promise<Member> {
    const clean = name.trim();
    if (this.members.some(member => member.householdCode === code && member.name.toLowerCase() === clean.toLowerCase())) {
      throw new Error('Tên này đã có trong Gia đình.');
    }
    const member = { id: `added-${this.nextId++}`, householdCode: code, name: clean, createdAt: new Date().toISOString() };
    this.members.push(member);
    this.emit(code);
    return { ...member };
  }
  async deleteMember(code: string, id: string): Promise<void> {
    this.members = this.members.filter(member => member.householdCode !== code || member.id !== id);
    this.emit(code);
  }
  subscribe(code: string, callback: () => void): () => void {
    if (!this.listeners.has(code)) this.listeners.set(code, new Set());
    this.listeners.get(code)!.add(callback);
    return () => { this.listeners.get(code)?.delete(callback); };
  }
  emit(code: string): void { this.listeners.get(code)?.forEach(callback => callback()); }
}

export const sampleMember = (name = 'Mẹ', householdCode = 'BEP-123', id = name): Member => ({
  id, householdCode, name, createdAt: '2026-10-08T00:00:00.000Z',
});

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
