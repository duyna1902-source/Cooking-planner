import { Dish, DishInput, createDishEntity, updateDishEntity } from '../domain/dish';
import { PlanRepository, defaultPlanRepository } from './planRepository';

export interface DishRepository {
  readonly isOnline?: boolean;
  getDishes(householdCode: string): Promise<Dish[]>;
  addDish(householdCode: string, input: DishInput): Promise<Dish>;
  updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish>;
  deleteDish(householdCode: string, id: string): Promise<void>;
  setPlanRepository?(planRepository: PlanRepository): void;
  subscribe?(householdCode: string, callback: () => void): () => void;
}

export class InMemoryDishRepository implements DishRepository {
  readonly isOnline = false;
  private dishes: Dish[] = [];
  private planRepository?: PlanRepository;

  constructor(initialDishes: Dish[] = [], planRepository?: PlanRepository) {
    this.dishes = [...initialDishes];
    this.planRepository = planRepository;
  }

  setPlanRepository(planRepository: PlanRepository): void {
    this.planRepository = planRepository;
  }

  async getDishes(householdCode: string): Promise<Dish[]> {
    return this.dishes.filter((d) => d.householdCode === householdCode);
  }

  async addDish(householdCode: string, input: DishInput): Promise<Dish> {
    const newDish = createDishEntity(householdCode, input);
    this.dishes.push(newDish);
    return newDish;
  }

  async updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish> {
    const index = this.dishes.findIndex((d) => d.householdCode === householdCode && d.id === id);
    if (index === -1) {
      throw new Error('Món ăn không tồn tại');
    }

    const updated = updateDishEntity(this.dishes[index], input);
    this.dishes[index] = updated;
    return updated;
  }

  async deleteDish(householdCode: string, id: string): Promise<void> {
    this.dishes = this.dishes.filter((d) => !(d.householdCode === householdCode && d.id === id));
    if (this.planRepository) {
      await this.planRepository.deletePlanItemsByDishId(householdCode, id);
    }
  }

  subscribe?(_householdCode: string, _callback: () => void): () => void {
    return () => {};
  }
}

export class LocalStorageDishRepository implements DishRepository {
  readonly isOnline = false;
  private planRepository?: PlanRepository;

  constructor(planRepository?: PlanRepository) {
    this.planRepository = planRepository;
  }

  subscribe?(_householdCode: string, _callback: () => void): () => void {
    return () => {};
  }

  setPlanRepository(planRepository: PlanRepository): void {
    this.planRepository = planRepository;
  }

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
    const dishes = this.readDishes(householdCode);
    const newDish = createDishEntity(householdCode, input);

    dishes.push(newDish);
    this.writeDishes(householdCode, dishes);
    return newDish;
  }

  async updateDish(householdCode: string, id: string, input: DishInput): Promise<Dish> {
    const dishes = this.readDishes(householdCode);
    const index = dishes.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Món ăn không tồn tại');
    }

    const updated = updateDishEntity(dishes[index], input);
    dishes[index] = updated;
    this.writeDishes(householdCode, dishes);
    return updated;
  }

  async deleteDish(householdCode: string, id: string): Promise<void> {
    const dishes = this.readDishes(householdCode);
    const filtered = dishes.filter((d) => d.id !== id);
    this.writeDishes(householdCode, filtered);
    if (this.planRepository) {
      await this.planRepository.deletePlanItemsByDishId(householdCode, id);
    }
  }
}

export const defaultDishRepository = new LocalStorageDishRepository(defaultPlanRepository);
