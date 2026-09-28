import { describe, it, expect } from 'vitest';
import { 
  validateDishInput, 
  filterDishes, 
  Dish 
} from '../../src/domain/dish';

describe('Dish / Menu domain logic', () => {
  it('validates dish input properly', () => {
    expect(validateDishInput({ name: 'Thịt kho trứng', tag: 'Món mặn' })).toEqual({ valid: true });
    expect(validateDishInput({ name: 'Canh chua' })).toEqual({ valid: true });
    expect(validateDishInput({ name: '   ' })).toEqual({ valid: false, error: 'Vui lòng nhập tên Món ăn' });
    expect(validateDishInput({ name: '' })).toEqual({ valid: false, error: 'Vui lòng nhập tên Món ăn' });
  });

  it('filters dishes by name or tag case-insensitively', () => {
    const dishes: Dish[] = [
      { id: '1', householdCode: 'BEP-892', name: 'Thịt kho trứng', tag: 'Món mặn', createdAt: '2026-09-29T00:00:00Z' },
      { id: '2', householdCode: 'BEP-892', name: 'Canh chua cá lóc', tag: 'Canh', createdAt: '2026-09-29T00:00:00Z' },
      { id: '3', householdCode: 'BEP-892', name: 'Rau muống xào tỏi', tag: 'Xào', createdAt: '2026-09-29T00:00:00Z' },
    ];

    expect(filterDishes(dishes, '')).toHaveLength(3);
    expect(filterDishes(dishes, 'thịt')).toEqual([dishes[0]]);
    expect(filterDishes(dishes, 'canh')).toEqual([dishes[1]]);
    expect(filterDishes(dishes, 'MÓN MẶN')).toEqual([dishes[0]]);
    expect(filterDishes(dishes, 'không tồn tại')).toHaveLength(0);
  });
});
