import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPlanRepository, LocalStoragePlanRepository } from '../../src/services/planRepository';

describe('PlanRepository', () => {
  let repo: InMemoryPlanRepository;

  beforeEach(() => {
    repo = new InMemoryPlanRepository();
  });

  it('initially returns empty list of plan items for a household', async () => {
    const items = await repo.getPlanItems('BEP-892');
    expect(items).toEqual([]);
  });

  it('adds dishes to a meal and prevents duplicate dishes in the same meal instance', async () => {
    const added = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1', 'dish-2']);
    expect(added).toHaveLength(2);
    expect(added[0].mealType).toBe('dinner');
    expect(added[0].dishId).toBe('dish-1');

    // Adding same dish again shouldn't duplicate
    const addedAgain = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1', 'dish-3']);
    expect(addedAgain).toHaveLength(1);
    expect(addedAgain[0].dishId).toBe('dish-3');

    const all = await repo.getPlanItems('BEP-892');
    expect(all).toHaveLength(3);
  });

  it('filters plan items by start and end date', async () => {
    await repo.addDishesToMeal('BEP-892', '2026-09-20', 'dinner', ['d1']);
    await repo.addDishesToMeal('BEP-892', '2026-09-28', 'dinner', ['d2']);
    await repo.addDishesToMeal('BEP-892', '2026-10-04', 'dinner', ['d3']);
    await repo.addDishesToMeal('BEP-892', '2026-10-10', 'dinner', ['d4']);

    const weekItems = await repo.getPlanItems('BEP-892', '2026-09-28', '2026-10-04');
    expect(weekItems).toHaveLength(2);
    expect(weekItems.map((i) => i.dishId)).toEqual(['d2', 'd3']);
  });

  it('removes a dish from a specific meal on a specific date', async () => {
    await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1', 'dish-2']);
    await repo.addDishesToMeal('BEP-892', '2026-09-29', 'lunch', ['dish-1']);

    await repo.removeDishFromMeal('BEP-892', '2026-09-29', 'dinner', 'dish-1');

    const remainingDinner = (await repo.getPlanItems('BEP-892')).filter(
      (i) => i.date === '2026-09-29' && i.mealType === 'dinner'
    );
    expect(remainingDinner).toHaveLength(1);
    expect(remainingDinner[0].dishId).toBe('dish-2');

    // Ensure lunch is unaffected
    const remainingLunch = (await repo.getPlanItems('BEP-892')).filter(
      (i) => i.date === '2026-09-29' && i.mealType === 'lunch'
    );
    expect(remainingLunch).toHaveLength(1);
    expect(remainingLunch[0].dishId).toBe('dish-1');
  });

  it('deletes all plan items referencing a deleted dishId across all dates and meals', async () => {
    await repo.addDishesToMeal('BEP-892', '2026-09-28', 'dinner', ['dish-1']);
    await repo.addDishesToMeal('BEP-892', '2026-09-29', 'lunch', ['dish-1']);
    await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-2']);

    await repo.deletePlanItemsByDishId('BEP-892', 'dish-1');

    const remaining = await repo.getPlanItems('BEP-892');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].dishId).toBe('dish-2');
  });

  it('isolates plan items between different households', async () => {
    await repo.addDishesToMeal('BEP-111', '2026-09-29', 'dinner', ['dish-1']);
    await repo.addDishesToMeal('BEP-222', '2026-09-29', 'dinner', ['dish-2']);

    const h1 = await repo.getPlanItems('BEP-111');
    const h2 = await repo.getPlanItems('BEP-222');

    expect(h1).toHaveLength(1);
    expect(h1[0].dishId).toBe('dish-1');
    expect(h2).toHaveLength(1);
    expect(h2[0].dishId).toBe('dish-2');
  });

  describe('Comment operations and cascade cleanup', () => {
    it('adds and retrieves comments for a specific planItem in chronological order', async () => {
      const addedDishes = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1']);
      const planItemId = addedDishes[0].id;

      const comment1 = await repo.addComment('BEP-892', planItemId, 'Mẹ Bắp', 'Mua thịt ba chỉ ít mỡ');
      expect(comment1.id).toBeDefined();
      expect(comment1.content).toBe('Mua thịt ba chỉ ít mỡ');
      expect(comment1.authorName).toBe('Mẹ Bắp');

      const comment2 = await repo.addComment('BEP-892', planItemId, 'Bố Ken', 'Nêm nhạt một chút');
      expect(comment2.id).toBeDefined();

      const comments = await repo.getComments('BEP-892', planItemId);
      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe('Mua thịt ba chỉ ít mỡ');
      expect(comments[1].content).toBe('Nêm nhạt một chút');
    });

    it('isolates comments by household and planItemId', async () => {
      const dishesH1 = await repo.addDishesToMeal('BEP-111', '2026-09-29', 'dinner', ['dish-1', 'dish-2']);
      const item1Id = dishesH1[0].id;
      const item2Id = dishesH1[1].id;

      await repo.addComment('BEP-111', item1Id, 'Mẹ', 'Comment cho Món ăn 1');
      await repo.addComment('BEP-111', item2Id, 'Mẹ', 'Comment cho Món ăn 2');

      const commentsItem1 = await repo.getComments('BEP-111', item1Id);
      expect(commentsItem1).toHaveLength(1);
      expect(commentsItem1[0].content).toBe('Comment cho Món ăn 1');

      const commentsOtherHousehold = await repo.getComments('BEP-222', item1Id);
      expect(commentsOtherHousehold).toHaveLength(0);
    });

    it('automatically wipes all comments for a dish instance when removing dish from meal', async () => {
      const addedDishes = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1']);
      const planItemId = addedDishes[0].id;

      await repo.addComment('BEP-892', planItemId, 'Mẹ Bắp', 'Ghi chú quan trọng');
      const commentsBefore = await repo.getComments('BEP-892', planItemId);
      expect(commentsBefore).toHaveLength(1);

      // Remove dish from meal
      await repo.removeDishFromMeal('BEP-892', '2026-09-29', 'dinner', 'dish-1');

      // Comments must be gone
      const commentsAfter = await repo.getComments('BEP-892', planItemId);
      expect(commentsAfter).toHaveLength(0);
    });

    it('persists comments and handles cascade deletion in LocalStoragePlanRepository', async () => {
      localStorage.clear();
      const localRepo = new LocalStoragePlanRepository();

      const added = await localRepo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1']);
      const planItemId = added[0].id;

      await localRepo.addComment('BEP-892', planItemId, 'Bố Ken', 'Ướp sẵn từ chiều');

      // Verify a new instance of LocalStoragePlanRepository can read the comments
      const newRepoInstance = new LocalStoragePlanRepository();
      const comments = await newRepoInstance.getComments('BEP-892', planItemId);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Ướp sẵn từ chiều');

      // When dish is removed, verify cascade delete works in localStorage
      await newRepoInstance.removeDishFromMeal('BEP-892', '2026-09-29', 'dinner', 'dish-1');
      const commentsAfter = await newRepoInstance.getComments('BEP-892', planItemId);
      expect(commentsAfter).toHaveLength(0);
    });

    it('cascades delete of dish from all past, present, and future plan items and comments', async () => {
      // Add dish-1 to past (within 2 weeks), present, and future meals
      const pastItems = await repo.addDishesToMeal('BEP-892', '2026-09-22', 'dinner', ['dish-1']);
      const currentItems = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-1', 'dish-2']);
      const futureItems = await repo.addDishesToMeal('BEP-892', '2026-10-06', 'dinner', ['dish-1']);

      // Add comments to all instances
      await repo.addComment('BEP-892', pastItems[0].id, 'Mẹ', 'Comment quá khứ');
      await repo.addComment('BEP-892', currentItems[0].id, 'Mẹ', 'Comment hiện tại');
      await repo.addComment('BEP-892', futureItems[0].id, 'Mẹ', 'Comment tương lai');

      // Now cascade delete dish-1
      await repo.deletePlanItemsByDishId('BEP-892', 'dish-1');

      // Plan items for dish-1 should be removed everywhere
      const allItems = await repo.getPlanItems('BEP-892');
      expect(allItems).toHaveLength(1);
      expect(allItems[0].dishId).toBe('dish-2');

      // All comments for dish-1 should be deleted
      const pastComments = await repo.getComments('BEP-892', pastItems[0].id);
      const currentComments = await repo.getComments('BEP-892', currentItems[0].id);
      const futureComments = await repo.getComments('BEP-892', futureItems[0].id);
      expect(pastComments).toHaveLength(0);
      expect(currentComments).toHaveLength(0);
      expect(futureComments).toHaveLength(0);
    });

    it('prunes items and comments older than 14 days via pruneOldHistory', async () => {
      // Base date is 2026-09-29, 2-week threshold Monday is 2026-09-14
      // Add item older than 2 weeks (2026-09-10)
      const oldItems = await repo.addDishesToMeal('BEP-892', '2026-09-10', 'dinner', ['dish-1']);
      await repo.addComment('BEP-892', oldItems[0].id, 'Bố', 'Comment cũ hơn 14 ngày');

      // Add item exactly on threshold (2026-09-14) and recent item (2026-09-29)
      const thresholdItems = await repo.addDishesToMeal('BEP-892', '2026-09-14', 'dinner', ['dish-2']);
      await repo.addComment('BEP-892', thresholdItems[0].id, 'Mẹ', 'Comment giữ lại');

      const recentItems = await repo.addDishesToMeal('BEP-892', '2026-09-29', 'dinner', ['dish-3']);

      // Execute pruning
      const result = await repo.pruneOldHistory('BEP-892', '2026-09-29');
      expect(result.prunedCount).toBe(1);

      // Verify old item is gone, valid items remain
      const allItems = await repo.getPlanItems('BEP-892');
      expect(allItems.map((i) => i.dishId)).toEqual(['dish-2', 'dish-3']);

      // Verify old comment is gone, threshold comment remains
      const oldComments = await repo.getComments('BEP-892', oldItems[0].id);
      expect(oldComments).toHaveLength(0);

      const keptComments = await repo.getComments('BEP-892', thresholdItems[0].id);
      expect(keptComments).toHaveLength(1);
    });
  });
});
