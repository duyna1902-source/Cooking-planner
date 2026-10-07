import { describe, it, expect } from 'vitest';
import {
  AVATAR_PRESETS,
  isValidMemberName,
  createMemberEntity,
  isDuplicateMemberName,
  Member,
  MemberInput,
} from '../../src/domain/member';

describe('Domain: Member', () => {
  describe('AVATAR_PRESETS', () => {
    it('contains exactly 8 curated kitchen presets matching spec', () => {
      expect(AVATAR_PRESETS).toHaveLength(8);

      const expectedIcons = ['🍳', '🥗', '🍜', '🥑', '🍰', '🍕', '🥕', '🍲'];
      const icons = AVATAR_PRESETS.map((p) => p.icon);
      expect(icons).toEqual(expectedIcons);
    });

    it('each preset has icon, bg color, border class, and vietnamese label', () => {
      AVATAR_PRESETS.forEach((preset) => {
        expect(preset.icon).toBeTruthy();
        expect(preset.bg).toMatch(/^bg-\[#[0-9A-Fa-f]{6}\]$/);
        expect(preset.border).toMatch(/^border-\[#[0-9A-Fa-f]{6}\]$/);
        expect(preset.label).toBeTruthy();
      });

      // Verify specific expected preset labels and colors
      expect(AVATAR_PRESETS[0]).toEqual({
        icon: '🍳',
        bg: 'bg-[#FEF7DC]',
        border: 'border-[#EFE4B5]',
        label: 'Chảo ốp la',
      });
      expect(AVATAR_PRESETS[1]).toEqual({
        icon: '🥗',
        bg: 'bg-[#DCFCE7]',
        border: 'border-[#BBF7D0]',
        label: 'Salad tươi',
      });
    });
  });

  describe('isValidMemberName', () => {
    it('returns true for valid member names within 30 characters', () => {
      expect(isValidMemberName('Mẹ')).toBe(true);
      expect(isValidMemberName('Bố')).toBe(true);
      expect(isValidMemberName('Bé An')).toBe(true);
      expect(isValidMemberName('Nguyễn Văn Bếp Trưởng')).toBe(true);
      expect(isValidMemberName('A'.repeat(30))).toBe(true);
    });

    it('returns true for names with leading/trailing spaces as long as trimmed length <= 30', () => {
      expect(isValidMemberName('  Mẹ  ')).toBe(true);
    });

    it('returns false for empty or whitespace-only names', () => {
      expect(isValidMemberName('')).toBe(false);
      expect(isValidMemberName('   ')).toBe(false);
      expect(isValidMemberName('\t\n')).toBe(false);
    });

    it('returns false for names longer than 30 characters', () => {
      expect(isValidMemberName('A'.repeat(31))).toBe(false);
      expect(isValidMemberName(' ' + 'A'.repeat(31) + ' ')).toBe(false);
    });

    it('returns false for null or undefined or non-string values', () => {
      expect(isValidMemberName(null as unknown as string)).toBe(false);
      expect(isValidMemberName(undefined as unknown as string)).toBe(false);
      expect(isValidMemberName(123 as unknown as string)).toBe(false);
    });
  });

  describe('createMemberEntity', () => {
    it('creates a Member entity with trimmed name and default avatar preset', () => {
      const member = createMemberEntity('BEP-892', { name: '  Mẹ Bắp  ' });
      expect(member.id).toBeTruthy();
      expect(member.householdCode).toBe('BEP-892');
      expect(member.name).toBe('Mẹ Bắp');
      expect(member.avatarIcon).toBe('🍳');
      expect(member.avatarColor).toBe('bg-[#FEF7DC]');
      expect(member.createdAt).toBeTruthy();
    });

    it('creates a Member entity with custom avatar preset', () => {
      const member = createMemberEntity('BEP-892', {
        name: 'Bố',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
      });
      expect(member.name).toBe('Bố');
      expect(member.avatarIcon).toBe('🍜');
      expect(member.avatarColor).toBe('bg-[#E0F2FE]');
    });
  });

  describe('isDuplicateMemberName', () => {
    const existing: Member[] = [
      {
        id: 'mem_1',
        householdCode: 'BEP-892',
        name: 'Mẹ Bắp',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: '2026-10-07T00:00:00.000Z',
      },
      {
        id: 'mem_2',
        householdCode: 'BEP-892',
        name: 'Bố Tuấn',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
        createdAt: '2026-10-07T00:00:00.000Z',
      },
    ];

    it('returns true when name matches existing member case-insensitively and trimmed', () => {
      expect(isDuplicateMemberName(existing, 'mẹ bắp')).toBe(true);
      expect(isDuplicateMemberName(existing, '  BỐ TUẤN  ')).toBe(true);
    });

    it('returns false when name does not match any existing member', () => {
      expect(isDuplicateMemberName(existing, 'Bé An')).toBe(false);
    });

    it('ignores member with excludeId when editing existing member', () => {
      expect(isDuplicateMemberName(existing, 'Mẹ Bắp', 'mem_1')).toBe(false);
      expect(isDuplicateMemberName(existing, 'Bố Tuấn', 'mem_1')).toBe(true);
    });
  });
});
