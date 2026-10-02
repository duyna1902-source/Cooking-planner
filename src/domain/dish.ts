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

export function createDishEntity(householdCode: string, input: DishInput): Dish {
  const validation = validateDishInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    id: generateDishId(),
    householdCode,
    name: input.name.trim(),
    tag: input.tag ? input.tag.trim() : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function updateDishEntity(existing: Dish, input: DishInput): Dish {
  const validation = validateDishInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    ...existing,
    name: input.name.trim(),
    tag: input.tag ? input.tag.trim() : undefined,
  };
}

/**
 * Normalizes Vietnamese string by removing diacritics for flexible fuzzy searching
 */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase();
}

/**
 * Filter dishes matching search query (supports both accented and unaccented Vietnamese search)
 */
export function filterDishes(dishes: Dish[], query: string): Dish[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return dishes;

  const rawQuery = removeVietnameseDiacritics(cleanQuery);

  return dishes.filter((dish) => {
    const nameLower = dish.name.toLowerCase();
    const tagLower = dish.tag ? dish.tag.toLowerCase() : '';

    const matchDirect = nameLower.includes(cleanQuery) || tagLower.includes(cleanQuery);
    if (matchDirect) return true;

    // Diacritic-tolerant search
    const nameRaw = removeVietnameseDiacritics(dish.name);
    const tagRaw = dish.tag ? removeVietnameseDiacritics(dish.tag) : '';
    return nameRaw.includes(rawQuery) || tagRaw.includes(rawQuery);
  });
}

/**
 * Checks if a search query is an exact 100% match with any dish in the list
 * (case-insensitive and trimmed).
 */
export function hasExactDishMatch(dishes: Dish[], query: string): boolean {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return false;
  return dishes.some((dish) => dish.name.trim().toLowerCase() === cleanQuery);
}
