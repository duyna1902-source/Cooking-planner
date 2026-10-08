export interface Member {
  id: string;
  householdCode: string;
  name: string;
  createdAt: string;
}

export type MemberErrorCode = 'duplicate-name' | 'invalid-name' | 'invalid-household' | 'unavailable';

export const MAX_MEMBERS_PER_HOUSEHOLD = 6;

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

function timestampNanos(value: string): bigint | null {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})$/.exec(value);
  if (!match) return null;
  const milliseconds = Date.parse(`${match[1]}T${match[2]}${match[4]}`);
  if (!Number.isFinite(milliseconds)) return null;
  const fraction = (match[3] ?? '').padEnd(9, '0').slice(0, 9);
  return BigInt(milliseconds) * 1_000_000n + BigInt(fraction);
}

export function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const left = timestampNanos(a.createdAt);
    const right = timestampNanos(b.createdAt);
    if (left !== null && right !== null && left !== right) return left < right ? -1 : 1;
    const leftMillis = Date.parse(a.createdAt);
    const rightMillis = Date.parse(b.createdAt);
    if (leftMillis !== rightMillis) return leftMillis - rightMillis;
    return a.id.localeCompare(b.id);
  });
}
