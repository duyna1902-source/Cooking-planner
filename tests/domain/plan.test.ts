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
  canNavigatePrevWeek,
  getRetentionThresholdDate,
  pruneExpiredPlanData,
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
      expect(comment.authorName).toBe('Mẹ Bắp');
      expect(comment.content).toBe('Nêm ít đường, mua thêm hành lá');
      expect(comment.createdAt).toBeDefined();
    });

    it('validates comment input', () => {
      // Valid input
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorName: 'Bố Ken',
          content: 'Nấu cay một chút nhé',
        })
      ).toEqual({ valid: true });

      // Empty content or whitespace only
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorName: 'Bố Ken',
          content: '   ',
        }).valid
      ).toBe(false);

      // Missing author name
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: 'plan-item-1',
          authorName: '',
          content: 'Nấu cay một chút nhé',
        }).valid
      ).toBe(false);

      // Missing plan item id
      expect(
        validateCommentInput({
          householdCode: 'BEP-892',
          planItemId: '',
          authorName: 'Bố Ken',
          content: 'Nấu cay một chút nhé',
        }).valid
      ).toBe(false);

      // Missing household code
      expect(
        validateCommentInput({
          householdCode: '',
          planItemId: 'plan-item-1',
          authorName: 'Bố Ken',
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
          authorName: 'Bố Ken',
          content: 'Nhớ mua rau sống ăn kèm',
          createdAt: '2026-09-29T10:05:00.000Z',
        },
        {
          id: 'c1',
          householdCode: 'BEP-892',
          planItemId: 'item-1',
          authorName: 'Mẹ Bắp',
          content: 'Kho thịt mềm nhé',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c3',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorName: 'Mẹ Bắp',
          content: 'Canh chua nấu bắp cải',
          createdAt: '2026-09-29T09:10:00.000Z',
        },
        {
          id: 'c4',
          householdCode: 'OTHER',
          planItemId: 'item-1',
          authorName: 'Ai Đó',
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
          authorName: 'Mẹ Bắp',
          content: 'Kho thịt',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c2',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorName: 'Mẹ Bắp',
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
          authorName: 'Mẹ Bắp',
          content: 'Note 1',
          createdAt: '2026-09-29T09:00:00.000Z',
        },
        {
          id: 'c2',
          householdCode: 'BEP-892',
          planItemId: 'item-2',
          authorName: 'Bố Ken',
          content: 'Note 2',
          createdAt: '2026-09-29T09:05:00.000Z',
        },
        {
          id: 'c3',
          householdCode: 'BEP-892',
          planItemId: 'item-3',
          authorName: 'Con Gái',
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

  describe('Two-Week Retention Policy and Navigation Boundary (ADR 0002)', () => {
    const baseDate = '2026-09-29'; // Base planning date (Tuesday, Monday of week is 2026-09-28)

    it('calculates the 2-week history retention threshold date aligned with earliest reachable Monday', () => {
      // 2026-09-29 is Tuesday in week starting 2026-09-28. Earliest reachable week is 2026-09-14.
      expect(getRetentionThresholdDate('2026-09-29')).toBe('2026-09-14');
      // 2026-10-01 is Thursday in week starting 2026-09-28. Earliest reachable week is 2026-09-14.
      expect(getRetentionThresholdDate('2026-10-01')).toBe('2026-09-14');
      // 2026-10-05 is Monday in next week. Earliest reachable week is 2026-09-21.
      expect(getRetentionThresholdDate('2026-10-05')).toBe('2026-09-21');
    });

    it('allows navigating to previous week when within 2 weeks prior to base planning date', () => {
      // Viewing active week (2026-09-28): can go back 1 week (to 2026-09-21)
      expect(canNavigatePrevWeek('2026-09-29', baseDate)).toBe(true);

      // Viewing 1 week ago (2026-09-22, Monday is 2026-09-21): can go back to 2 weeks ago (2026-09-14)
      expect(canNavigatePrevWeek('2026-09-22', baseDate)).toBe(true);

      // Viewing future weeks: can definitely go back
      expect(canNavigatePrevWeek('2026-10-06', baseDate)).toBe(true);
    });

    it('disallows navigating to previous week when at the 2-week history boundary', () => {
      // Viewing 2 weeks ago (Monday is 2026-09-14, which is 14 days before 2026-09-28):
      // Going back 1 more week would be 3 weeks ago (> 14 days), so it must be blocked!
      expect(canNavigatePrevWeek('2026-09-15', baseDate)).toBe(false);
      expect(canNavigatePrevWeek('2026-09-14', baseDate)).toBe(false);

      // Anything older than 2 weeks ago is also blocked
      expect(canNavigatePrevWeek('2026-09-07', baseDate)).toBe(false);
    });

    it('prunes plan items and their associated comments older than the threshold date', () => {
      const thresholdDate = '2026-09-15';

      const planItems: PlanItem[] = [
        { id: 'item-old-1', householdCode: 'BEP-892', date: '2026-09-10', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-10T10:00:00Z' },
        { id: 'item-old-2', householdCode: 'BEP-892', date: '2026-09-14', mealType: 'dinner', dishId: 'd2', createdAt: '2026-09-14T10:00:00Z' },
        { id: 'item-valid-1', householdCode: 'BEP-892', date: '2026-09-15', mealType: 'dinner', dishId: 'd1', createdAt: '2026-09-15T10:00:00Z' },
        { id: 'item-valid-2', householdCode: 'BEP-892', date: '2026-09-29', mealType: 'dinner', dishId: 'd3', createdAt: '2026-09-29T10:00:00Z' },
      ];

      const comments: PlanComment[] = [
        { id: 'c-old-1', householdCode: 'BEP-892', planItemId: 'item-old-1', authorName: 'Mẹ', content: 'Ghi chú cũ 1', createdAt: '2026-09-10T10:05:00Z' },
        { id: 'c-old-2', householdCode: 'BEP-892', planItemId: 'item-old-2', authorName: 'Bố', content: 'Ghi chú cũ 2', createdAt: '2026-09-14T10:05:00Z' },
        { id: 'c-valid-1', householdCode: 'BEP-892', planItemId: 'item-valid-1', authorName: 'Mẹ', content: 'Ghi chú giữ lại', createdAt: '2026-09-15T10:05:00Z' },
      ];

      const { remainingItems, remainingComments } = pruneExpiredPlanData(planItems, comments, thresholdDate);

      // Old items are pruned, items on or after threshold are kept
      expect(remainingItems).toHaveLength(2);
      expect(remainingItems.map((i) => i.id)).toEqual(['item-valid-1', 'item-valid-2']);

      // Comments for pruned items are also pruned
      expect(remainingComments).toHaveLength(1);
      expect(remainingComments[0].id).toBe('c-valid-1');
    });
  });
});
