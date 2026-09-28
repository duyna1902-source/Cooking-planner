import {
  PlanItem,
  MealType,
  MealSlot,
  filterPlanItems,
  addDishesToPlanList,
  removeDishFromPlanList,
} from '../domain/plan';

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
    return filterPlanItems(this.items, householdCode, startDate, endDate);
  }

  async addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]> {
    const slot: MealSlot = { householdCode, date, mealType };
    const { updatedItems, addedItems } = addDishesToPlanList(this.items, slot, dishIds);
    this.items = updatedItems;
    return addedItems;
  }

  async removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void> {
    const slot: MealSlot = { householdCode, date, mealType };
    this.items = removeDishFromPlanList(this.items, slot, dishId);
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
    return filterPlanItems(items, householdCode, startDate, endDate);
  }

  async addDishesToMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishIds: string[]
  ): Promise<PlanItem[]> {
    const items = this.readItems(householdCode);
    const slot: MealSlot = { householdCode, date, mealType };
    const { updatedItems, addedItems } = addDishesToPlanList(items, slot, dishIds);
    this.writeItems(householdCode, updatedItems);
    return addedItems;
  }

  async removeDishFromMeal(
    householdCode: string,
    date: string,
    mealType: MealType,
    dishId: string
  ): Promise<void> {
    const items = this.readItems(householdCode);
    const slot: MealSlot = { householdCode, date, mealType };
    const updatedItems = removeDishFromPlanList(items, slot, dishId);
    this.writeItems(householdCode, updatedItems);
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
