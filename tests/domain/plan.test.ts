import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  formatDateToISO,
  parseISODate,
  getShiftedWeekDate,
  createPlanItemEntity,
  validatePlanItemInput,
  groupPlanItemsByMeal,
  PlanItem,
} from '../../src/domain/plan';

describe('Plan Domain Logic', () => {
  describe('Date and Week calculations', () => {
    it('formats Date to ISO string YYYY-MM-DD correctly', () => {
      const date = new Date(2026, 8, 29); // Month is 0-indexed, so 8 = Sep
      expect(formatDateToISO(date)).toBe('2026-09-29');
    });

    it('parses ISO date string to Date object consistently without timezone shift', () => {
      const date = parseISODate('2026-09-29');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(8);
      expect(date.getDate()).toBe(29);
    });

    it('generates 7 days (Monday to Sunday) for any given date in a week', () => {
      // 2026-09-29 is a Tuesday
      const tuesday = new Date(2026, 8, 29);
      const days = getWeekDays(tuesday, tuesday);

      expect(days).toHaveLength(7);
      expect(days[0].label).toBe('T2');
      expect(days[0].dateStr).toBe('2026-09-28');
      expect(days[0].dayNumber).toBe(28);
      expect(days[0].isToday).toBe(false);

      expect(days[1].label).toBe('T3');
      expect(days[1].dateStr).toBe('2026-09-29');
      expect(days[1].isToday).toBe(true);

      expect(days[6].label).toBe('CN');
      expect(days[6].dateStr).toBe('2026-10-04');
      expect(days[6].dayNumber).toBe(4);
    });

    it('shifts week by offset', () => {
      const currentMonday = '2026-09-28';
      expect(getShiftedWeekDate(currentMonday, -1)).toBe('2026-09-21');
      expect(getShiftedWeekDate(currentMonday, 1)).toBe('2026-10-05');
    });
  });

  describe('PlanItem creation and validation', () => {
    it('creates a valid PlanItem entity', () => {
      const item = createPlanItemEntity('BEP-892', '2026-09-29', 'dinner', 'dish-123');
      expect(item.id).toBeDefined();
      expect(item.householdCode).toBe('BEP-892');
      expect(item.date).toBe('2026-09-29');
      expect(item.mealType).toBe('dinner');
      expect(item.dishId).toBe('dish-123');
      expect(item.createdAt).toBeDefined();
    });

    it('validates plan item inputs', () => {
      expect(validatePlanItemInput({ householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'dish-1' })).toEqual({ valid: true });
      expect(validatePlanItemInput({ householdCode: '', date: '2026-09-29', mealType: 'dinner', dishId: 'dish-1' }).valid).toBe(false);
      expect(validatePlanItemInput({ householdCode: 'BEP-892', date: '', mealType: 'dinner', dishId: 'dish-1' }).valid).toBe(false);
      expect(validatePlanItemInput({ householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: '' }).valid).toBe(false);
    });

    it('groups plan items by meal type for a specific date', () => {
      const items: PlanItem[] = [
        { id: '1', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-29T10:00:00Z' },
        { id: '2', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'd2', createdAt: '2026-09-29T10:00:00Z' },
        { id: '3', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'lunch', dishId: 'd3', createdAt: '2026-09-29T10:00:00Z' },
        { id: '4', householdCode: 'BEP-892', date: '2026-09-30', mealType: 'dinner', dishId: 'd4', createdAt: '2026-09-29T10:00:00Z' },
      ];

      const grouped = groupPlanItemsByMeal(items, '2026-09-29');
      expect(grouped.breakfast).toEqual([]);
      expect(grouped.lunch).toHaveLength(1);
      expect(grouped.lunch[0].dishId).toBe('d3');
      expect(grouped.dinner).toHaveLength(2);
      expect(grouped.dinner.map((i) => i.dishId)).toEqual(['d1', 'd2']);
    });
  });
});
