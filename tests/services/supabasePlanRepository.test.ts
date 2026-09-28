import { describe, it, expect, vi } from 'vitest';
import { SupabasePlanRepository } from '../../src/services/supabasePlanRepository';

describe('SupabasePlanRepository', () => {
  describe('getPlanItems', () => {
    it('queries plan_items from Supabase and maps database rows to domain entities', async () => {
      const mockRows = [
        {
          id: 'plan_1',
          household_code: 'HOUSE123',
          date: '2026-09-29',
          meal_type: 'dinner',
          dish_id: 'dish_1',
          created_at: '2026-09-29T10:00:00.000Z',
        },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const mockClient: any = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      const items = await repo.getPlanItems('HOUSE123');

      expect(mockClient.from).toHaveBeenCalledWith('plan_items');
      expect(eqMock).toHaveBeenCalledWith('household_code', 'HOUSE123');
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        id: 'plan_1',
        householdCode: 'HOUSE123',
        date: '2026-09-29',
        mealType: 'dinner',
        dishId: 'dish_1',
        createdAt: '2026-09-29T10:00:00.000Z',
      });
    });

    it('applies date range filters when startDate and endDate are provided', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const lteMock = vi.fn().mockReturnValue({ order: orderMock });
      const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
      const eqMock = vi.fn().mockReturnValue({ gte: gteMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const mockClient: any = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      await repo.getPlanItems('HOUSE123', '2026-09-20', '2026-09-27');

      expect(gteMock).toHaveBeenCalledWith('date', '2026-09-20');
      expect(lteMock).toHaveBeenCalledWith('date', '2026-09-27');
    });
  });

  describe('addDishesToMeal', () => {
    it('checks for existing dishes in the slot to prevent duplicates and inserts new ones', async () => {
      const existingRows = [{ dish_id: 'dish_1' }];
      const eqMealMock = vi.fn().mockResolvedValue({ data: existingRows, error: null });
      const eqDateMock = vi.fn().mockReturnValue({ eq: eqMealMock });
      const eqCodeMock = vi.fn().mockReturnValue({ eq: eqDateMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqCodeMock });

      const insertMock = vi.fn().mockResolvedValue({ error: null });

      const mockClient: any = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'plan_items') {
            return {
              select: selectMock,
              insert: insertMock,
            };
          }
          return {};
        }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      const added = await repo.addDishesToMeal('HOUSE123', '2026-09-29', 'dinner', [
        'dish_1', // Duplicate -> should be ignored
        'dish_2', // New -> should be added
      ]);

      expect(added).toHaveLength(1);
      expect(added[0].dishId).toBe('dish_2');
      expect(added[0].mealType).toBe('dinner');
      expect(insertMock).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when dishIds is empty', async () => {
      const mockClient: any = { from: vi.fn() };
      const repo = new SupabasePlanRepository(mockClient);
      const added = await repo.addDishesToMeal('HOUSE123', '2026-09-29', 'dinner', []);
      expect(added).toHaveLength(0);
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  describe('removeDishFromMeal', () => {
    it('deletes plan item by household, date, mealType, and dishId', async () => {
      const eqDishMock = vi.fn().mockResolvedValue({ error: null });
      const eqMealMock = vi.fn().mockReturnValue({ eq: eqDishMock });
      const eqDateMock = vi.fn().mockReturnValue({ eq: eqMealMock });
      const eqCodeMock = vi.fn().mockReturnValue({ eq: eqDateMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqCodeMock });

      const mockClient: any = {
        from: vi.fn().mockReturnValue({ delete: deleteMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      await repo.removeDishFromMeal('HOUSE123', '2026-09-29', 'dinner', 'dish_1');

      expect(mockClient.from).toHaveBeenCalledWith('plan_items');
      expect(eqDishMock).toHaveBeenCalledWith('dish_id', 'dish_1');
    });
  });

  describe('deletePlanItemsByDishId', () => {
    it('deletes all plan items for a specific dish across all dates', async () => {
      const eqDishMock = vi.fn().mockResolvedValue({ error: null });
      const eqCodeMock = vi.fn().mockReturnValue({ eq: eqDishMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqCodeMock });

      const mockClient: any = {
        from: vi.fn().mockReturnValue({ delete: deleteMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      await repo.deletePlanItemsByDishId('HOUSE123', 'dish_1');

      expect(mockClient.from).toHaveBeenCalledWith('plan_items');
      expect(eqDishMock).toHaveBeenCalledWith('dish_id', 'dish_1');
    });
  });

  describe('comments management', () => {
    it('fetches comments for a plan item ordered by created_at', async () => {
      const mockRows = [
        {
          id: 'comm_1',
          household_code: 'HOUSE123',
          plan_item_id: 'plan_1',
          author_nickname: 'Mẹ',
          content: 'Nấu ít cay',
          created_at: '2026-09-29T11:00:00.000Z',
        },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const eqItemMock = vi.fn().mockReturnValue({ order: orderMock });
      const eqCodeMock = vi.fn().mockReturnValue({ eq: eqItemMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqCodeMock });

      const mockClient: any = {
        from: vi.fn().mockReturnValue({ select: selectMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      const comments = await repo.getComments('HOUSE123', 'plan_1');

      expect(mockClient.from).toHaveBeenCalledWith('plan_comments');
      expect(comments).toHaveLength(1);
      expect(comments[0].authorNickname).toBe('Mẹ');
      expect(comments[0].content).toBe('Nấu ít cay');
    });

    it('adds a comment with validation', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const mockClient: any = {
        from: vi.fn().mockReturnValue({ insert: insertMock }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      const comment = await repo.addComment('HOUSE123', 'plan_1', 'Bố', 'Mua thêm rau thơm');

      expect(comment.content).toBe('Mua thêm rau thơm');
      expect(comment.authorNickname).toBe('Bố');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          household_code: 'HOUSE123',
          plan_item_id: 'plan_1',
          author_nickname: 'Bố',
          content: 'Mua thêm rau thơm',
        })
      );
    });

    it('throws error when comment content is empty', async () => {
      const mockClient: any = { from: vi.fn() };
      const repo = new SupabasePlanRepository(mockClient);

      await expect(repo.addComment('HOUSE123', 'plan_1', 'Bố', '   ')).rejects.toThrow(
        'Nội dung dặn dò không được để trống'
      );
    });
  });

  describe('pruneOldHistory', () => {
    it('deletes plan items older than 2 weeks retention threshold', async () => {
      const expiredItems = [{ id: 'old_1' }, { id: 'old_2' }];

      const ltSelectMock = vi.fn().mockResolvedValue({ data: expiredItems, error: null });
      const eqCodeSelectMock = vi.fn().mockReturnValue({ lt: ltSelectMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqCodeSelectMock });

      const ltDeleteMock = vi.fn().mockResolvedValue({ error: null });
      const eqCodeDeleteMock = vi.fn().mockReturnValue({ lt: ltDeleteMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqCodeDeleteMock });

      const mockClient: any = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
          delete: deleteMock,
        }),
      };

      const repo = new SupabasePlanRepository(mockClient);
      const result = await repo.pruneOldHistory('HOUSE123', '2026-09-29');

      expect(result.prunedCount).toBe(2);
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('subscribes to plan_items and plan_comments realtime events', () => {
      const callback = vi.fn();
      const removeChannelMock = vi.fn();
      const subscribeMock = vi.fn();
      const onMock = vi.fn().mockReturnThis();

      const mockClient: any = {
        channel: vi.fn().mockReturnValue({
          on: onMock,
          subscribe: subscribeMock,
        }),
        removeChannel: removeChannelMock,
      };

      const repo = new SupabasePlanRepository(mockClient);
      const unsubscribe = repo.subscribe('HOUSE123', callback);

      expect(mockClient.channel).toHaveBeenCalled();
      expect(onMock).toHaveBeenCalledTimes(2); // plan_items and plan_comments
      expect(subscribeMock).toHaveBeenCalled();

      // Trigger handler
      const firstHandler = onMock.mock.calls[0][2];
      firstHandler({});
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(removeChannelMock).toHaveBeenCalled();
    });
  });
});
