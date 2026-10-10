import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  HouseholdStorage,
  HouseholdNavigationState,
  LocalStorageHouseholdStorage,
  InMemoryHouseholdStorage,
} from '../../src/services/storage';

describe('HouseholdStorage navigation state contract', () => {
  describe('InMemoryHouseholdStorage', () => {
    it('defaults to choosing_household when empty', () => {
      const storage = new InMemoryHouseholdStorage();
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('transitions safely to choosing_member when only legacy household code is provided', () => {
      const storage = new InMemoryHouseholdStorage('BEP-123', 'Old nickname');
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-123',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-123');
      expect(storage.getNickname()).toBe('Old nickname');
    });

    it('supports explicitly setting and getting navigation states', () => {
      const storage = new InMemoryHouseholdStorage();

      storage.setNavigationState({ status: 'choosing_member', householdCode: 'BEP-456' });
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-456',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-456');

      storage.setNavigationState({
        status: 'selected',
        householdCode: 'BEP-456',
        memberId: 'member-01',
      });
      expect(storage.getNavigationState()).toEqual({
        status: 'selected',
        householdCode: 'BEP-456',
        memberId: 'member-01',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-456');

      storage.setNavigationState({ status: 'choosing_household' });
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('clears navigation state when clearSession is called', () => {
      const storage = new InMemoryHouseholdStorage();
      storage.setNavigationState({
        status: 'selected',
        householdCode: 'BEP-789',
        memberId: 'm-9',
      });
      storage.clearSession();
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('manages saved households with LRU order, deduplication, and normalization', () => {
      const storage = new InMemoryHouseholdStorage();
      expect(storage.getSavedHouseholds()).toEqual([]);

      storage.saveHousehold('bep-101');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-101']);

      storage.saveHousehold('BEP-202');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-202', 'BEP-101']);

      // Re-saving existing household moves it to the front without duplicates
      storage.saveHousehold('bep-101');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-101', 'BEP-202']);

      // Invalid code is ignored
      storage.saveHousehold('!invalid');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-101', 'BEP-202']);

      // Removing a saved household
      storage.removeSavedHousehold('BEP-101');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-202']);
    });

    it('resets navigation state to choosing_household if removing the active household', () => {
      const storage = new InMemoryHouseholdStorage();
      storage.saveHousehold('BEP-101');
      storage.setNavigationState({ status: 'choosing_member', householdCode: 'BEP-101' });

      storage.removeSavedHousehold('BEP-101');
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('does not alter navigation state if removing a household other than the active one', () => {
      const storage = new InMemoryHouseholdStorage();
      storage.saveHousehold('BEP-101');
      storage.saveHousehold('BEP-202');
      storage.setNavigationState({ status: 'choosing_member', householdCode: 'BEP-202' });

      storage.removeSavedHousehold('BEP-101');
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-202',
      });
    });

    it('backwards compatibility: includes initial legacy householdCode in getSavedHouseholds', () => {
      const storage = new InMemoryHouseholdStorage('bep-999');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-999']);

      // Saving another code puts it at the front
      storage.saveHousehold('BEP-111');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-111', 'BEP-999']);
    });
  });

  describe('LocalStorageHouseholdStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('defaults to choosing_household when localStorage is empty', () => {
      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('backwards compatibility: translates legacy cooking_plan_household_code to choosing_member without inferring member from nickname', () => {
      localStorage.setItem('cooking_plan_household_code', 'BEP-999');
      localStorage.setItem('cooking_plan_nickname', 'Mẹ');

      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-999',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-999');
    });

    it('stores and retrieves choosing_household, choosing_member, and selected navigation states', () => {
      const storage = new LocalStorageHouseholdStorage();

      storage.setNavigationState({ status: 'choosing_member', householdCode: 'BEP-555' });
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-555',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-555');

      storage.setNavigationState({
        status: 'selected',
        householdCode: 'BEP-555',
        memberId: 'mem-123',
      });
      expect(storage.getNavigationState()).toEqual({
        status: 'selected',
        householdCode: 'BEP-555',
        memberId: 'mem-123',
      });
      expect(storage.getHouseholdCode()).toBe('BEP-555');

      storage.setNavigationState({ status: 'choosing_household' });
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('recovers gracefully from corrupted JSON in navigation state key and falls back to legacy or default', () => {
      localStorage.setItem('cooking_plan_navigation_state', 'invalid-json{{{');
      localStorage.setItem('cooking_plan_household_code', 'BEP-CORRUPT');

      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-CORRUPT',
      });
    });

    it('persists saved households in localStorage with LRU order and deduplication', () => {
      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getSavedHouseholds()).toEqual([]);

      storage.saveHousehold('bep-100');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-100']);
      expect(JSON.parse(localStorage.getItem('cooking_plan_saved_households')!)).toEqual(['BEP-100']);

      storage.saveHousehold('BEP-200');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-200', 'BEP-100']);

      // Re-saving bep-100 moves to front
      storage.saveHousehold('BEP-100');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-100', 'BEP-200']);

      // Removing a household
      storage.removeSavedHousehold('BEP-200');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-100']);
      expect(JSON.parse(localStorage.getItem('cooking_plan_saved_households')!)).toEqual(['BEP-100']);
    });

    it('resets navigation state to choosing_household if removing the active household in LocalStorage', () => {
      const storage = new LocalStorageHouseholdStorage();
      storage.saveHousehold('BEP-300');
      storage.setNavigationState({ status: 'selected', householdCode: 'BEP-300', memberId: 'm-1' });

      storage.removeSavedHousehold('BEP-300');
      expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
      expect(storage.getHouseholdCode()).toBeNull();
    });

    it('backwards compatibility: includes legacy cooking_plan_household_code in getSavedHouseholds if saved key is missing', () => {
      localStorage.setItem('cooking_plan_household_code', 'BEP-LEGACY');

      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getSavedHouseholds()).toEqual(['BEP-LEGACY']);

      // Once explicit save happens, it saves to cooking_plan_saved_households
      storage.saveHousehold('BEP-NEW');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-NEW', 'BEP-LEGACY']);
    });

    it('does not resurrect legacy code once cooking_plan_saved_households is explicitly set or emptied', () => {
      localStorage.setItem('cooking_plan_household_code', 'BEP-LEGACY');
      localStorage.setItem('cooking_plan_saved_households', JSON.stringify([]));

      const storage = new LocalStorageHouseholdStorage();
      expect(storage.getSavedHouseholds()).toEqual([]);
    });
  });
});
