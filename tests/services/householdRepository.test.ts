import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryHouseholdRepository,
  LocalStorageHouseholdRepository
} from '../../src/services/householdRepository';

describe('HouseholdRepository', () => {
  describe('InMemoryHouseholdRepository', () => {
    let repo: InMemoryHouseholdRepository;

    beforeEach(() => {
      repo = new InMemoryHouseholdRepository();
    });

    it('returns empty array when getting members of non-existent household', async () => {
      const members = await repo.getMembers('BEP-892');
      expect(members).toEqual([]);
    });

    it('saves a household and retrieves it and its members', async () => {
      await repo.saveHousehold({
        code: 'BEP-892',
        members: ['Mẹ', 'Bố'],
        createdAt: new Date().toISOString()
      });

      const household = await repo.getHousehold('BEP-892');
      expect(household).not.toBeNull();
      expect(household?.code).toBe('BEP-892');
      expect(household?.members).toEqual(['Mẹ', 'Bố']);

      const members = await repo.getMembers('BEP-892');
      expect(members).toEqual(['Mẹ', 'Bố']);
    });

    it('adds a member to an existing household', async () => {
      await repo.saveHousehold({
        code: 'BEP-892',
        members: ['Mẹ'],
        createdAt: new Date().toISOString()
      });

      const updated = await repo.addMember('BEP-892', 'Bố');
      expect(updated.members).toEqual(['Mẹ', 'Bố']);

      const fetchedMembers = await repo.getMembers('BEP-892');
      expect(fetchedMembers).toEqual(['Mẹ', 'Bố']);
    });

    it('creates a new household if adding member to non-existent household', async () => {
      const household = await repo.addMember('BEP-123', 'Tôm');
      expect(household.code).toBe('BEP-123');
      expect(household.members).toEqual(['Tôm']);
    });

    it('isolates members between different households', async () => {
      await repo.addMember('BEP-111', 'Thành Viên 1');
      await repo.addMember('BEP-222', 'Thành Viên 2');

      const members1 = await repo.getMembers('BEP-111');
      const members2 = await repo.getMembers('BEP-222');

      expect(members1).toEqual(['Thành Viên 1']);
      expect(members2).toEqual(['Thành Viên 2']);
    });
  });

  describe('LocalStorageHouseholdRepository', () => {
    let repo: LocalStorageHouseholdRepository;

    beforeEach(() => {
      localStorage.clear();
      repo = new LocalStorageHouseholdRepository();
    });

    it('persists and loads household members across repository instances', async () => {
      await repo.saveHousehold({
        code: 'BEP-892',
        members: ['Mẹ', 'Bố'],
        createdAt: new Date().toISOString()
      });

      const repo2 = new LocalStorageHouseholdRepository();
      const household = await repo2.getHousehold('BEP-892');
      expect(household?.members).toEqual(['Mẹ', 'Bố']);

      await repo2.addMember('BEP-892', 'Bé Na');
      const repo3 = new LocalStorageHouseholdRepository();
      const members = await repo3.getMembers('BEP-892');
      expect(members).toEqual(['Mẹ', 'Bố', 'Bé Na']);
    });
  });
});
