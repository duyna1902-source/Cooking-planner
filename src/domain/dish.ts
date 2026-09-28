export interface Dish {
  id: string;
  householdCode: string;
  name: string;
  tag?: string;
  createdAt: string;
}

export interface DishInput {
  name: string;
  tag?: string;
}

export function generateDishId(): string {
  return `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function validateDishInput(input: DishInput): { valid: boolean; error?: string } {
  const trimmedName = input.name ? input.name.trim() : '';
  if (!trimmedName) {
    return { valid: false, error: 'Vui lòng nhập tên Món ăn' };
  }
  return { valid: true };
}

export function filterDishes(dishes: Dish[], query: string): Dish[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return dishes;

  return dishes.filter((dish) => {
    const matchName = dish.name.toLowerCase().includes(cleanQuery);
    const matchTag = dish.tag ? dish.tag.toLowerCase().includes(cleanQuery) : false;
    return matchName || matchTag;
  });
}
