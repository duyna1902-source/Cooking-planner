import { describe, it, expect } from 'vitest';
import {
  MAX_MEMBERS_PER_HOUSEHOLD,
  normalizeMemberName,
  memberNameKey,
  sortMembers,
  Member,
  MemberError,
} from '../../src/domain/member';

describe('Member domain logic', () => {
  it('defines MAX_MEMBERS_PER_HOUSEHOLD as 6', () => {
    expect(MAX_MEMBERS_PER_HOUSEHOLD).toBe(6);
  });

  it('normalizes member names and trims whitespace', () => {
    expect(normalizeMemberName('  Mẹ  ')).toBe('Mẹ');
  });

  it('throws MemberError on invalid name length', () => {
    expect(() => normalizeMemberName('')).toThrow(MemberError);
    expect(() => normalizeMemberName('   ')).toThrow(MemberError);
    expect(() => normalizeMemberName('a'.repeat(31))).toThrow(MemberError);
  });

  it('computes memberNameKey by lowercasing and trimming', () => {
    expect(memberNameKey(' Mẹ ')).toBe('mẹ');
    expect(memberNameKey('BỐ')).toBe('bố');
  });

  it('sorts members by timestamp and stable id', () => {
    const list: Member[] = [
      { id: '2', householdCode: 'BEP-123', name: 'Bố', createdAt: '2026-10-08T00:00:02Z' },
      { id: '1', householdCode: 'BEP-123', name: 'Mẹ', createdAt: '2026-10-08T00:00:01Z' },
    ];
    const sorted = sortMembers(list);
    expect(sorted[0].name).toBe('Mẹ');
    expect(sorted[1].name).toBe('Bố');
  });
});
