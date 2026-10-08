export interface Member {
  id: string;
  householdCode: string;
  name: string;
  createdAt: string;
}

export type MemberErrorCode = 'duplicate-name' | 'invalid-name' | 'invalid-household' | 'unavailable';

export class MemberError extends Error {
  constructor(public readonly code: MemberErrorCode, message: string) { super(message); this.name = 'MemberError'; }
}

export function normalizeMemberName(name: string): string {
  const clean = name.trim();
  if (Array.from(clean).length < 1 || Array.from(clean).length > 30) {
    throw new MemberError('invalid-name', 'Nhập tên từ 1 đến 30 ký tự nhé.');
  }
  return clean;
}

export function memberNameKey(name: string): string { return name.trim().toLowerCase(); }

export function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}
