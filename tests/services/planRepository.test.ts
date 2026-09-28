import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPlanRepository } from '../../src/services/planRepository';

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
});
