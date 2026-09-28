import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDishRepository } from '../../src/services/dishRepository';

describe('DishRepository', () => {
  let repo: InMemoryDishRepository;

  beforeEach(() => {
    repo = new InMemoryDishRepository();
  });

  it('initially returns empty list of dishes for a household', async () => {
    const dishes = await repo.getDishes('BEP-892');
    expect(dishes).toEqual([]);
  });

  it('adds and retrieves a dish', async () => {
    const dish = await repo.addDish('BEP-892', { name: 'Thịt kho tàu', tag: 'Món mặn' });
    expect(dish.id).toBeDefined();
    expect(dish.name).toBe('Thịt kho tàu');
    expect(dish.tag).toBe('Món mặn');
    expect(dish.householdCode).toBe('BEP-892');

    const list = await repo.getDishes('BEP-892');
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(dish);
  });

  it('isolates dishes between different households', async () => {
    await repo.addDish('BEP-111', { name: 'Món A' });
    await repo.addDish('BEP-222', { name: 'Món B' });

    const list1 = await repo.getDishes('BEP-111');
    const list2 = await repo.getDishes('BEP-222');

    expect(list1).toHaveLength(1);
    expect(list1[0].name).toBe('Món A');
    expect(list2).toHaveLength(1);
    expect(list2[0].name).toBe('Món B');
  });

  it('updates an existing dish', async () => {
    const created = await repo.addDish('BEP-892', { name: 'Canh chua cá', tag: 'Canh' });
    const updated = await repo.updateDish('BEP-892', created.id, { name: 'Canh chua cá lóc', tag: 'Món nước' });

    expect(updated.name).toBe('Canh chua cá lóc');
    expect(updated.tag).toBe('Món nước');

    const list = await repo.getDishes('BEP-892');
    expect(list[0].name).toBe('Canh chua cá lóc');
  });

  it('deletes a dish from the household menu', async () => {
    const dish = await repo.addDish('BEP-892', { name: 'Rau muống xào' });
    await repo.deleteDish('BEP-892', dish.id);

    const list = await repo.getDishes('BEP-892');
    expect(list).toHaveLength(0);
  });
});
