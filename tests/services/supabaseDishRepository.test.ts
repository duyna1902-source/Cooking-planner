import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseDishRepository } from '../../src/services/supabaseDishRepository';
import { PlanRepository } from '../../src/services/planRepository';

describe('SupabaseDishRepository', () => {
  let mockClient: any;
  let mockPlanRepo: PlanRepository;

  beforeEach(() => {
    mockPlanRepo = {
      getPlanItems: vi.fn(),
      addDishesToMeal: vi.fn(),
      removeDishFromMeal: vi.fn(),
      deletePlanItemsByDishId: vi.fn().mockResolvedValue(undefined),
      getComments: vi.fn(),
      addComment: vi.fn(),
      deleteCommentsByPlanItemId: vi.fn(),
      pruneOldHistory: vi.fn(),
    };
  });

  describe('getDishes', () => {
    it('queries dishes from supabase and maps database rows to domain entities', async () => {
      const mockRows = [
        {
          id: 'dish_1',
          household_code: 'HOUSE123',
          name: 'Phở bò',
          tag: 'Món nước',
          created_at: '2026-09-29T00:00:00.000Z',
        },
        {
          id: 'dish_2',
          household_code: 'HOUSE123',
          name: 'Cơm tấm',
          tag: null,
          created_at: '2026-09-29T01:00:00.000Z',
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
        }),
      });

      mockClient = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
        }),
      };

      const repo = new SupabaseDishRepository(mockClient);
      const dishes = await repo.getDishes('HOUSE123');

      expect(mockClient.from).toHaveBeenCalledWith('dishes');
      expect(dishes).toHaveLength(2);
      expect(dishes[0]).toEqual({
        id: 'dish_1',
        householdCode: 'HOUSE123',
        name: 'Phở bò',
        tag: 'Món nước',
        createdAt: '2026-09-29T00:00:00.000Z',
      });
      expect(dishes[1].tag).toBeUndefined();
    });

    it('throws error if supabase query returns an error', async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
            }),
          }),
        }),
      };

      const repo = new SupabaseDishRepository(mockClient);
      await expect(repo.getDishes('HOUSE123')).rejects.toThrow('Database error');
    });
  });

  describe('addDish', () => {
    it('creates entity, inserts into dishes table, and returns created dish', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      const repo = new SupabaseDishRepository(mockClient);
      const newDish = await repo.addDish('HOUSE123', { name: 'Bún chả', tag: 'Hà Nội' });

      expect(mockClient.from).toHaveBeenCalledWith('dishes');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          household_code: 'HOUSE123',
          name: 'Bún chả',
          tag: 'Hà Nội',
        })
      );
      expect(newDish.name).toBe('Bún chả');
      expect(newDish.householdCode).toBe('HOUSE123');
    });

    it('throws validation error if dish name is empty', async () => {
      mockClient = { from: vi.fn() };
      const repo = new SupabaseDishRepository(mockClient);

      await expect(repo.addDish('HOUSE123', { name: '   ' })).rejects.toThrow(
        'Vui lòng nhập tên Món ăn'
      );
    });
  });

  describe('updateDish', () => {
    it('updates dish name and tag and returns updated domain entity', async () => {
      const updatedRow = {
        id: 'dish_1',
        household_code: 'HOUSE123',
        name: 'Phở bò tái nạm',
        tag: 'Món nước',
        created_at: '2026-09-29T00:00:00.000Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqIdMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqHouseholdMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqHouseholdMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          update: updateMock,
        }),
      };

      const repo = new SupabaseDishRepository(mockClient);
      const result = await repo.updateDish('HOUSE123', 'dish_1', {
        name: 'Phở bò tái nạm',
        tag: 'Món nước',
      });

      expect(mockClient.from).toHaveBeenCalledWith('dishes');
      expect(updateMock).toHaveBeenCalledWith({
        name: 'Phở bò tái nạm',
        tag: 'Món nước',
      });
      expect(result.name).toBe('Phở bò tái nạm');
    });
  });

  describe('deleteDish', () => {
    it('deletes dish from table and cascades delete to plan repository', async () => {
      const eqIdMock = vi.fn().mockResolvedValue({ error: null });
      const eqHouseholdMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqHouseholdMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          delete: deleteMock,
        }),
      };

      const repo = new SupabaseDishRepository(mockClient, mockPlanRepo);
      await repo.deleteDish('HOUSE123', 'dish_1');

      expect(mockClient.from).toHaveBeenCalledWith('dishes');
      expect(eqHouseholdMock).toHaveBeenCalledWith('household_code', 'HOUSE123');
      expect(eqIdMock).toHaveBeenCalledWith('id', 'dish_1');
      expect(mockPlanRepo.deletePlanItemsByDishId).toHaveBeenCalledWith('HOUSE123', 'dish_1');
    });
  });

  describe('subscribe', () => {
    it('subscribes to realtime channel and unsubscribes on cleanup', () => {
      const callback = vi.fn();
      const removeChannelMock = vi.fn();
      const subscribeMock = vi.fn();
      const onMock = vi.fn().mockReturnThis();

      mockClient = {
        channel: vi.fn().mockReturnValue({
          on: onMock,
          subscribe: subscribeMock,
        }),
        removeChannel: removeChannelMock,
      };

      const repo = new SupabaseDishRepository(mockClient);
      const unsubscribe = repo.subscribe('HOUSE123', callback);

      expect(mockClient.channel).toHaveBeenCalled();
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'dishes',
          filter: 'household_code=eq.HOUSE123',
        }),
        expect.any(Function)
      );
      expect(subscribeMock).toHaveBeenCalled();

      // Trigger the callback registered in on()
      const registeredHandler = onMock.mock.calls[0][2];
      registeredHandler({});
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(removeChannelMock).toHaveBeenCalled();
    });
  });
});
