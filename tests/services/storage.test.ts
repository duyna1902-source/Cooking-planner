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
  });
});
