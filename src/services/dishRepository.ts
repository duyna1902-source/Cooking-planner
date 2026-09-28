import { Dish, DishInput, generateDishId, validateDishInput } from '../domain/dish';

export interface DishRepository {
  getDishes(householdCode: string): Promise<Dish[]>;
  addDish(householdCode: string, input: DishInput): Promise<Dish>;
  updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish>;
  deleteDish(householdCode: string, id: string): Promise<void>;
}

export class InMemoryDishRepository implements DishRepository {
  private dishes: Dish[] = [];

  constructor(initialDishes: Dish[] = []) {
    this.dishes = [...initialDishes];
  }

  async getDishes(householdCode: string): Promise<Dish[]> {
    return this.dishes.filter((d) => d.householdCode === householdCode);
  }

  async addDish(householdCode: string, input: DishInput): Promise<Dish> {
    const validation = validateDishInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newDish: Dish = {
      id: generateDishId(),
      householdCode,
      name: input.name.trim(),
      tag: input.tag ? input.tag.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    this.dishes.push(newDish);
    return newDish;
  }

  async updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish> {
    const validation = validateDishInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const index = this.dishes.findIndex((d) => d.householdCode === householdCode && d.id === id);
    if (index === -1) {
      throw new Error('Món ăn không tồn tại');
    }

    const updated: Dish = {
      ...this.dishes[index],
      name: input.name.trim(),
      tag: input.tag ? input.tag.trim() : undefined,
    };

    this.dishes[index] = updated;
    return updated;
  }

  async deleteDish(householdCode: string, id: string): Promise<void> {
    this.dishes = this.dishes.filter((d) => !(d.householdCode === householdCode && d.id === id));
  }
}

export class LocalStorageDishRepository implements DishRepository {
  private getStorageKey(householdCode: string): string {
    return `cooking_plan_dishes_${householdCode}`;
  }

  private readDishes(householdCode: string): Dish[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(householdCode));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeDishes(householdCode: string, dishes: Dish[]): void {
    try {
      localStorage.setItem(this.getStorageKey(householdCode), JSON.stringify(dishes));
    } catch {
      // Ignored in quota/restricted cases
    }
  }

  async getDishes(householdCode: string): Promise<Dish[]> {
    return this.readDishes(householdCode);
  }

  async addDish(householdCode: string, input: DishInput): Promise<Dish> {
    const validation = validateDishInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const dishes = this.readDishes(householdCode);
    const newDish: Dish = {
      id: generateDishId(),
      householdCode,
      name: input.name.trim(),
      tag: input.tag ? input.tag.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    dishes.push(newDish);
    this.writeDishes(householdCode, dishes);
    return newDish;
  }

  async updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish> {
    const validation = validateDishInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const dishes = this.readDishes(householdCode);
    const index = dishes.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Món ăn không tồn tại');
    }

    const updated: Dish = {
      ...dishes[index],
      name: input.name.trim(),
      tag: input.tag ? input.tag.trim() : undefined,
    };

    dishes[index] = updated;
    this.writeDishes(householdCode, dishes);
    return updated;
  }

  async deleteDish(householdCode: string, id: string): Promise<void> {
    const dishes = this.readDishes(householdCode);
    const filtered = dishes.filter((d) => d.id !== id);
    this.writeDishes(householdCode, filtered);
  }
}

export const defaultDishRepository = new LocalStorageDishRepository();
