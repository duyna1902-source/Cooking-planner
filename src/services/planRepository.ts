import {
  PlanItem,
  MealType,
  MealSlot,
  PlanComment,
  filterPlanItems,
  addDishesToPlanList,
  removeDishFromPlanList,
  createPlanCommentEntity,
  filterCommentsForPlanItem,
  deleteCommentsForPlanItem,
  deleteCommentsForPlanItems,
  getRetentionThresholdDate,
  pruneExpiredPlanData,
} from '../domain/plan';

export interface PlanRepository {
  readonly isOnline?: boolean;
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
  getComments(householdCode: string, planItemId: string): Promise<PlanComment[]>;
  addComment(
    householdCode: string,
    planItemId: string,
    authorNickname: string,
    content: string
  ): Promise<PlanComment>;
  deleteCommentsByPlanItemId(householdCode: string, planItemId: string): Promise<void>;
  pruneOldHistory(householdCode: string, basePlanningDate: string): Promise<{ prunedCount: number }>;
  getDayCooks(householdCode: string, startDate?: string, endDate?: string): Promise<Record<string, string>>;
  assignDayCook(householdCode: string, date: string, cookName: string): Promise<void>;
  unassignDayCook(householdCode: string, date: string): Promise<void>;
  subscribe?(householdCode: string, callback: () => void): () => void;
}

export class InMemoryPlanRepository implements PlanRepository {
  readonly isOnline = false;
  private items: PlanItem[] = [];
  private comments: PlanComment[] = [];
  private dayCooks: Map<string, string> = new Map();

  constructor(
    initialItems: PlanItem[] = [],
    initialComments: PlanComment[] = [],
    initialDayCooks: Record<string, string> = {}
  ) {
    this.items = [...initialItems];
    this.comments = [...initialComments];
    for (const [date, cook] of Object.entries(initialDayCooks)) {
      this.dayCooks.set(date, cook);
    }
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
    const removedItemIds = this.items
      .filter(
        (i) =>
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
      )
      .map((i) => i.id);

    this.items = removeDishFromPlanList(this.items, slot, dishId);
    if (removedItemIds.length > 0) {
      this.comments = deleteCommentsForPlanItems(this.comments, householdCode, removedItemIds);
    }
  }

  async deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void> {
    const removedItemIds = this.items
      .filter((i) => i.householdCode === householdCode && i.dishId === dishId)
      .map((i) => i.id);

    this.items = this.items.filter(
      (i) => !(i.householdCode === householdCode && i.dishId === dishId)
    );
    if (removedItemIds.length > 0) {
      this.comments = deleteCommentsForPlanItems(this.comments, householdCode, removedItemIds);
    }
  }

  async getComments(householdCode: string, planItemId: string): Promise<PlanComment[]> {
    return filterCommentsForPlanItem(this.comments, householdCode, planItemId);
  }

  async addComment(
    householdCode: string,
    planItemId: string,
    authorNickname: string,
    content: string
  ): Promise<PlanComment> {
    const newComment = createPlanCommentEntity(householdCode, planItemId, authorNickname, content);
    this.comments.push(newComment);
    return newComment;
  }

  async deleteCommentsByPlanItemId(householdCode: string, planItemId: string): Promise<void> {
    this.comments = deleteCommentsForPlanItem(this.comments, householdCode, planItemId);
  }

  async pruneOldHistory(householdCode: string, basePlanningDate: string): Promise<{ prunedCount: number }> {
    const thresholdDate = getRetentionThresholdDate(basePlanningDate);
    const householdItems = this.items.filter((i) => i.householdCode === householdCode);
    const otherItems = this.items.filter((i) => i.householdCode !== householdCode);

    const householdComments = this.comments.filter((c) => c.householdCode === householdCode);
    const otherComments = this.comments.filter((c) => c.householdCode !== householdCode);

    const { remainingItems, remainingComments } = pruneExpiredPlanData(
      householdItems,
      householdComments,
      thresholdDate
    );

    const prunedCount = householdItems.length - remainingItems.length;
    this.items = [...otherItems, ...remainingItems];
    this.comments = [...otherComments, ...remainingComments];

    const prefix = `${householdCode}::`;
    for (const key of Array.from(this.dayCooks.keys())) {
      if (key.startsWith(prefix)) {
        const date = key.slice(prefix.length);
        if (date < thresholdDate) {
          this.dayCooks.delete(key);
        }
      }
    }

    return { prunedCount };
  }

  async getDayCooks(
    householdCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const prefix = `${householdCode}::`;
    for (const [key, cookName] of this.dayCooks.entries()) {
      if (key.startsWith(prefix)) {
        const date = key.slice(prefix.length);
        if (startDate && date < startDate) continue;
        if (endDate && date > endDate) continue;
        result[date] = cookName;
      }
    }
    return result;
  }

  async assignDayCook(householdCode: string, date: string, cookName: string): Promise<void> {
    this.dayCooks.set(`${householdCode}::${date}`, cookName);
  }

  async unassignDayCook(householdCode: string, date: string): Promise<void> {
    this.dayCooks.delete(`${householdCode}::${date}`);
  }

  subscribe?(_householdCode: string, _callback: () => void): () => void {
    return () => {};
  }
}

export class LocalStoragePlanRepository implements PlanRepository {
  readonly isOnline = false;
  private getStorageKey(householdCode: string): string {
    return `cooking_plan_items_${householdCode}`;
  }

  private getCommentsStorageKey(householdCode: string): string {
    return `cooking_plan_comments_${householdCode}`;
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

  private readComments(householdCode: string): PlanComment[] {
    try {
      const data = localStorage.getItem(this.getCommentsStorageKey(householdCode));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeComments(householdCode: string, comments: PlanComment[]): void {
    try {
      localStorage.setItem(this.getCommentsStorageKey(householdCode), JSON.stringify(comments));
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
    const removedItemIds = items
      .filter(
        (i) =>
          i.householdCode === householdCode &&
          i.date === date &&
          i.mealType === mealType &&
          i.dishId === dishId
      )
      .map((i) => i.id);

    const updatedItems = removeDishFromPlanList(items, slot, dishId);
    this.writeItems(householdCode, updatedItems);

    if (removedItemIds.length > 0) {
      const comments = this.readComments(householdCode);
      const updatedComments = deleteCommentsForPlanItems(comments, householdCode, removedItemIds);
      this.writeComments(householdCode, updatedComments);
    }
  }

  async deletePlanItemsByDishId(householdCode: string, dishId: string): Promise<void> {
    const items = this.readItems(householdCode);
    const removedItemIds = items
      .filter((i) => i.householdCode === householdCode && i.dishId === dishId)
      .map((i) => i.id);

    const filtered = items.filter(
      (i) => !(i.householdCode === householdCode && i.dishId === dishId)
    );
    this.writeItems(householdCode, filtered);

    if (removedItemIds.length > 0) {
      const comments = this.readComments(householdCode);
      const updatedComments = deleteCommentsForPlanItems(comments, householdCode, removedItemIds);
      this.writeComments(householdCode, updatedComments);
    }
  }

  async getComments(householdCode: string, planItemId: string): Promise<PlanComment[]> {
    const comments = this.readComments(householdCode);
    return filterCommentsForPlanItem(comments, householdCode, planItemId);
  }

  async addComment(
    householdCode: string,
    planItemId: string,
    authorNickname: string,
    content: string
  ): Promise<PlanComment> {
    const comments = this.readComments(householdCode);
    const newComment = createPlanCommentEntity(householdCode, planItemId, authorNickname, content);
    comments.push(newComment);
    this.writeComments(householdCode, comments);
    return newComment;
  }

  async deleteCommentsByPlanItemId(householdCode: string, planItemId: string): Promise<void> {
    const comments = this.readComments(householdCode);
    const updatedComments = deleteCommentsForPlanItem(comments, householdCode, planItemId);
    this.writeComments(householdCode, updatedComments);
  }

  async pruneOldHistory(householdCode: string, basePlanningDate: string): Promise<{ prunedCount: number }> {
    const thresholdDate = getRetentionThresholdDate(basePlanningDate);
    const items = this.readItems(householdCode);
    const comments = this.readComments(householdCode);

    const { remainingItems, remainingComments } = pruneExpiredPlanData(items, comments, thresholdDate);
    const itemsChanged = items.length !== remainingItems.length;
    const commentsChanged = comments.length !== remainingComments.length;

    if (itemsChanged) {
      this.writeItems(householdCode, remainingItems);
    }
    if (commentsChanged) {
      this.writeComments(householdCode, remainingComments);
    }

    const cooks = this.readDayCooks(householdCode);
    let cooksChanged = false;
    for (const date of Object.keys(cooks)) {
      if (date < thresholdDate) {
        delete cooks[date];
        cooksChanged = true;
      }
    }
    if (cooksChanged) {
      this.writeDayCooks(householdCode, cooks);
    }

    return { prunedCount: items.length - remainingItems.length };
  }

  private getDayCooksStorageKey(householdCode: string): string {
    return `cooking_plan_day_cooks_${householdCode}`;
  }

  private readDayCooks(householdCode: string): Record<string, string> {
    try {
      const data = localStorage.getItem(this.getDayCooksStorageKey(householdCode));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private writeDayCooks(householdCode: string, cooks: Record<string, string>): void {
    try {
      localStorage.setItem(this.getDayCooksStorageKey(householdCode), JSON.stringify(cooks));
    } catch {
      // Ignored
    }
  }

  async getDayCooks(
    householdCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, string>> {
    const cooks = this.readDayCooks(householdCode);
    const result: Record<string, string> = {};
    for (const [date, cook] of Object.entries(cooks)) {
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;
      result[date] = cook;
    }
    return result;
  }

  async assignDayCook(householdCode: string, date: string, cookName: string): Promise<void> {
    const cooks = this.readDayCooks(householdCode);
    cooks[date] = cookName;
    this.writeDayCooks(householdCode, cooks);
  }

  async unassignDayCook(householdCode: string, date: string): Promise<void> {
    const cooks = this.readDayCooks(householdCode);
    delete cooks[date];
    this.writeDayCooks(householdCode, cooks);
  }

  subscribe?(_householdCode: string, _callback: () => void): () => void {
    return () => {};
  }
}

export const defaultPlanRepository = new LocalStoragePlanRepository();
