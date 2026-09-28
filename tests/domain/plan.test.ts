import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  formatDateToISO,
  parseISODate,
  getShiftedWeekDate,
  createPlanItemEntity,
  validatePlanItemInput,
  groupPlanItemsByMeal,
  filterPlanItems,
  addDishesToPlanList,
  removeDishFromPlanList,
  PlanItem,
  PlanComment,
  createPlanCommentEntity,
  validateCommentInput,
  filterCommentsForPlanItem,
  deleteCommentsForPlanItem,
  deleteCommentsForPlanItems,
  formatCommentTimestamp,
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

    it('filters plan items by household and date range', () => {
      const items: PlanItem[] = [
        { id: '1', householdCode: 'BEP-892', date: '2026-09-20', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-20T10:00:00Z' },
        { id: '2', householdCode: 'BEP-892', date: '2026-09-28', mealType: 'dinner', dishId: 'd2', createdAt: '2026-09-28T10:00:00Z' },
        { id: '3', householdCode: 'BEP-892', date: '2026-10-04', mealType: 'dinner', dishId: 'd3', createdAt: '2026-10-04T10:00:00Z' },
        { id: '4', householdCode: 'OTHER', date: '2026-09-28', mealType: 'dinner', dishId: 'd4', createdAt: '2026-09-28T10:00:00Z' },
      ];

      const filtered = filterPlanItems(items, 'BEP-892', '2026-09-28', '2026-10-04');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((i) => i.dishId)).toEqual(['d2', 'd3']);
    });

    it('adds dishes to plan list without duplicates in the same slot', () => {
      const initial: PlanItem[] = [
        { id: '1', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-29T10:00:00Z' },
      ];
      const slot = { householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner' as const };
      const { updatedItems, addedItems } = addDishesToPlanList(initial, slot, ['d1', 'd2']);

      expect(addedItems).toHaveLength(1);
      expect(addedItems[0].dishId).toBe('d2');
      expect(updatedItems).toHaveLength(2);
    });

    it('removes a dish from plan list for a specific slot', () => {
      const initial: PlanItem[] = [
        { id: '1', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-29T10:00:00Z' },
        { id: '2', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'lunch', dishId: 'd1', createdAt: '2026-09-29T10:00:00Z' },
      ];
      const slot = { householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner' as const };
      const result = removeDishFromPlanList(initial, slot, 'd1');

      expect(result).toHaveLength(1);
      expect(result[0].mealType).toBe('lunch');
    });
  });

  describe('PlanComment creation, validation, and filtering', () => {
    it('creates a valid PlanComment entity with generated ID and timestamp', () => {
      const comment = createPlanCommentEntity(
        'BEP-892',
        'plan-item-1',
        'Mẹ Bắp',
        'Nêm ít đường, mua thêm hành lá'
      );

      expect(comment.id).toMatch(/^comment_/);
      expect(comment.householdCode).toBe('BEP-892');
      expect(comment.planItemId).toBe('plan-item-1');
      expect(comment.authorNickname).toBe('Mẹ Bắp');
      expect(comment.content).toBe('Nêm ít đường, mua thêm hành lá');
      expect(comment.createdAt).toBeDefined();
    });

    it('validates comment input', () => {
      // Valid input
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorNickname: 'Bố Ken',
          content: 'Nấu cay một chút nhé',
        })
      ).toEqual({ valid: true });

      // Empty content or whitespace only
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorNickname: 'Bố Ken',
          content: '   ',
        }).valid
      ).toBe(false);

      // Missing author nickname
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorNickname: '',
          content: 'Nấu cay một chút nhé',
        }).valid
      ).toBe(false);

      // Missing plan item id
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: '',
          authorNickname: 'Bố Ken',
          content: 'Nấu cay một chút nhé',
        }).valid
      ).toBe(false);

      // Missing household code
      expect(
        validateCommentInput({
          householdCode: '',
          planItemId: 'plan-item-1',
          authorNickname: 'Bố Ken',
          content: 'Nấu cay một chút nhé',
        }).valid
      ).toBe(false);
    });

    it('filters and sorts comments for a specific planItem in chronological order', () => {
      const comments: PlanComment[] = [
        {
          id: 'c2',
          householdCode: 'BEP-892',
          planItemId: 'item-1',
          authorNickname: 'Bố Ken',
          content: 'Nhớ mua rau sống ăn kèm',
          createdAt: '2026-09-29T10:05:00.000Z',
        },
        {
          id: 'c1',
          householdCode: 'BEP-892',
          planItemId: 'item-1',
          authorNickname: 'Mẹ Bắp',
          content: 'Kho thịt mềm nhé',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c3',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorNickname: 'Mẹ Bắp',
          content: 'Canh chua nấu bắp cải',
          createdAt: '2026-09-29T09:10:00.000Z',
        },
        {
          id: 'c4',
          householdCode: 'OTHER',
          planItemId: 'item-1',
          authorNickname: 'Ai Đó',
          content: 'Comment nhà khác',
          createdAt: '2026-09-29T08:00:00.000Z',
        },
      ];

      const result = filterCommentsForPlanItem(comments, 'BEP-892', 'item-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c1'); // Earlier timestamp first
      expect(result[1].id).toBe('c2');
    });

    it('deletes comments for a specific planItem', () => {
      const comments: PlanComment[] = [
        {
          id: 'c1',
          householdCode: 'BEP-892',
          planItemId: 'item-1',
          authorNickname: 'Mẹ Bắp',
          content: 'Kho thịt',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c2',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorNickname: 'Mẹ Bắp',
          content: 'Nấu canh',
          createdAt: '2026-09-29T09:05:00.000Z',
        },
      ];

      const remaining = deleteCommentsForPlanItem(comments, 'BEP-892', 'item-1');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('c2');
    });

    it('deletes comments for multiple planItems', () => {
      const comments: PlanComment[] = [
        {
          id: 'c1',
          householdCode: 'BEP-892',
          planItemId: 'item-1',
          authorNickname: 'Mẹ Bắp',
          content: 'Note 1',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c2',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorNickname: 'Bố Ken',
          content: 'Note 2',
          createdAt: '2026-09-29T09:05:00.000Z',
        },
        {
          id: 'c3',
          householdCode: 'BEP-892',
          planItemId: 'item-3',
          authorNickname: 'Con Gái',
          content: 'Note 3',
          createdAt: '2026-09-29T09:10:00.000Z',
        },
      ];

      const remaining = deleteCommentsForPlanItems(comments, 'BEP-892', ['item-1', 'item-3']);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('c2');
    });

    it('formats comment timestamp cleanly as HH:mm, DD/MM', () => {
      // 2026-09-29 18:30:00 local time
      const testDate = new Date(2026, 8, 29, 18, 30);
      const isoStr = testDate.toISOString();
      const formatted = formatCommentTimestamp(isoStr);

      expect(formatted).toBe('18:30, 29/09');
    });
  });
});
