import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageMemberRepository,
  InMemoryMemberRepository,
  MemberRepository,
} from '../../src/services/memberRepository';

describe('MemberRepository (LocalStorage & InMemory)', () => {
  describe('InMemoryMemberRepository', () => {
    let repo: MemberRepository;

    beforeEach(() => {
      repo = new InMemoryMemberRepository();
    });

    it('initially returns empty list of members for a household', async () => {
      const members = await repo.getMembers('BEP-892');
      expect(members).toEqual([]);
    });

    it('adds and retrieves a member', async () => {
      const created = await repo.addMember({
        householdCode: 'BEP-892',
        name: 'Mẹ',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      });

      expect(created.id).toBeDefined();
      expect(created.householdCode).toBe('BEP-892');
      expect(created.name).toBe('Mẹ');
      expect(created.avatarIcon).toBe('🍳');
      expect(created.avatarColor).toBe('bg-[#FEF7DC]');
      expect(created.createdAt).toBeDefined();

      const members = await repo.getMembers('BEP-892');
      expect(members).toHaveLength(1);
      expect(members[0]).toEqual(created);
    });

    it('isolates members between different households', async () => {
      await repo.addMember({
        householdCode: 'BEP-111',
        name: 'Mẹ 1',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      });
      await repo.addMember({
        householdCode: 'BEP-222',
        name: 'Mẹ 2',
        avatarIcon: '🥗',
        avatarColor: 'bg-[#DCFCE7]',
      });

      const list1 = await repo.getMembers('BEP-111');
      const list2 = await repo.getMembers('BEP-222');

      expect(list1).toHaveLength(1);
      expect(list1[0].name).toBe('Mẹ 1');
      expect(list2).toHaveLength(1);
      expect(list2[0].name).toBe('Mẹ 2');
    });

    it('rejects adding a member with invalid or empty name', async () => {
      await expect(
        repo.addMember({
          householdCode: 'BEP-892',
          name: '   ',
          avatarIcon: '🍳',
          avatarColor: 'bg-[#FEF7DC]',
        })
      ).rejects.toThrow('Tên thành viên không hợp lệ');
    });

    it('rejects adding duplicate member name in the same household (case-insensitive)', async () => {
      await repo.addMember({
        householdCode: 'BEP-892',
        name: 'Mẹ Bắp',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      });

      await expect(
        repo.addMember({
          householdCode: 'BEP-892',
          name: '  mẹ bắp  ',
          avatarIcon: '🥗',
          avatarColor: 'bg-[#DCFCE7]',
        })
      ).rejects.toThrow('Tên thành viên đã tồn tại');
    });

    it('updates an existing member', async () => {
      const created = await repo.addMember({
        householdCode: 'BEP-892',
        name: 'Bố',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
      });

      const updated = await repo.updateMember(created.id, {
        name: 'Bố Yêu',
        avatarIcon: '🍲',
        avatarColor: 'bg-[#F3E8FF]',
      });

      expect(updated.name).toBe('Bố Yêu');
      expect(updated.avatarIcon).toBe('🍲');
      expect(updated.avatarColor).toBe('bg-[#F3E8FF]');

      const members = await repo.getMembers('BEP-892');
      expect(members[0].name).toBe('Bố Yêu');
    });

    it('deletes a member', async () => {
      const created = await repo.addMember({
        householdCode: 'BEP-892',
        name: 'Bé An',
        avatarIcon: '🥑',
        avatarColor: 'bg-[#ECFCCB]',
      });

      await repo.deleteMember(created.id, 'BEP-892');
      const members = await repo.getMembers('BEP-892');
      expect(members).toHaveLength(0);
    });
  });

  describe('LocalStorageMemberRepository', () => {
    let repo: LocalStorageMemberRepository;

    beforeEach(() => {
      localStorage.clear();
      repo = new LocalStorageMemberRepository();
    });

    it('persists members to localStorage with key cooking_plan_members_${householdCode}', async () => {
      const created = await repo.addMember({
        householdCode: 'BEP-999',
        name: 'Mẹ',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      });

      const raw = localStorage.getItem('cooking_plan_members_BEP-999');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Mẹ');

      // Create new instance and verify reading from storage
      const newRepoInstance = new LocalStorageMemberRepository();
      const members = await newRepoInstance.getMembers('BEP-999');
      expect(members).toHaveLength(1);
      expect(members[0]).toEqual(created);
    });

    it('updates member in localStorage correctly', async () => {
      const created = await repo.addMember({
        householdCode: 'BEP-999',
        name: 'Con',
        avatarIcon: '🍰',
        avatarColor: 'bg-[#FCE7F3]',
      });

      await repo.updateMember(created.id, { name: 'Con Út' });

      const members = await repo.getMembers('BEP-999');
      expect(members[0].name).toBe('Con Út');
    });

    it('deletes member from localStorage correctly', async () => {
      const m1 = await repo.addMember({
        householdCode: 'BEP-999',
        name: 'Mẹ',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      });
      const m2 = await repo.addMember({
        householdCode: 'BEP-999',
        name: 'Bố',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
      });

      await repo.deleteMember(m1.id, 'BEP-999');
      const members = await repo.getMembers('BEP-999');
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(m2.id);
    });
  });
});
