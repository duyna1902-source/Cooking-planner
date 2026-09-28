import { PlanItem, MealType, createPlanItemEntity } from '../domain/plan';

export interface PlanRepository {
  getPlanItems(householdCode: string, startDate?: string, endDate?: string): Promise<PlanItem[]>;
  addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]>;
  removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void>;
  deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void>;
}

export class InMemoryPlanRepository implements PlanRepository {
  private items: PlanItem[] = [];

  constructor(initialItems: PlanItem[] = []) {
    this.items = [...initialItems];
  }

  async getPlanItems(householdCode: string, startDate?: string, endDate?: string): Promise<PlanItem[]> {
    return this.items.filter((item) => {
      if (item.householdCode !== householdCode) return false;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  }

  async addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]> {
    const added: PlanItem[] = [];

    for (const dishId of dishIds) {
      const alreadyExists = this.items.some(
        (i) =>
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
      );

      if (!alreadyExists) {
        const newItem = createPlanItemEntity(householdCode, date, mealType, dishId);
        this.items.push(newItem);
        added.push(newItem);
      }
    }

    return added;
  }

  async removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void> {
    this.items = this.items.filter(
      (i) =>
        !(
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
        )
    );
  }

  async deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void> {
    this.items = this.items.filter(
      (i) => !(i.householdCode === householdCode && i.dishId === dishId)
    );
  }
}

export class LocalStoragePlanRepository implements PlanRepository {
  private getStorageKey(householdCode: string): string {
    return `cooking_plan_items_${householdCode}`;
  }

  private readItems(householdCode: string): PlanItem[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(householdCode));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeItems(householdCode: string, items: PlanItem[]): void {
    try {
      localStorage.setItem(this.getStorageKey(householdCode), JSON.stringify(items));
    } catch {
      // Ignored in quota/restricted cases
    }
  }

  async getPlanItems(householdCode: string, startDate?: string, endDate?: string): Promise<PlanItem[]> {
    const items = this.readItems(householdCode);
    return items.filter((item) => {
      if (item.householdCode !== householdCode) return false;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  }

  async addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]> {
    const items = this.readItems(householdCode);
    const added: PlanItem[] = [];

    for (const dishId of dishIds) {
      const alreadyExists = items.some(
        (i) =>
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
      );

      if (!alreadyExists) {
        const newItem = createPlanItemEntity(householdCode, date, mealType, dishId);
        items.push(newItem);
        added.push(newItem);
      }
    }

    this.writeItems(householdCode, items);
    return added;
  }

  async removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void> {
    const items = this.readItems(householdCode);
    const filtered = items.filter(
      (i) =>
        !(
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
        )
    );
    this.writeItems(householdCode, filtered);
  }

  async deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void> {
    const items = this.readItems(householdCode);
    const filtered = items.filter(
      (i) => !(i.householdCode === householdCode && i.dishId === dishId)
    );
    this.writeItems(householdCode, filtered);
  }
}

export const defaultPlanRepository = new LocalStoragePlanRepository();
