export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface PlanItem {
  id: string;
  householdCode: string;
  date: string; // ISO format 'YYYY-MM-DD'
  mealType: MealType;
  dishId: string;
  createdAt: string;
}

export interface DayInfo {
  label: string; // 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'
  dayNumber: number;
  dateStr: string; // 'YYYY-MM-DD'
  isToday: boolean;
  isFuture: boolean;
  fullLabel: string;
}

export interface MealSlot {
  householdCode: string;
  date: string;
  mealType: MealType;
}

export interface DayCookAssignment {
  householdCode: string;
  dateStr: string; // 'YYYY-MM-DD'
  cookName: string;
}

export interface PlanItemInput {
  householdCode: string;
  date: string;
  mealType: MealType;
  dishId: string;
}

export function generatePlanItemId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FULL_DAY_NAMES = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekDays(baseDate: Date | string, today: Date = new Date()): DayInfo[] {
  const parsedBase = typeof baseDate === 'string' ? parseISODate(baseDate) : baseDate;
  const monday = getMondayOfWeek(parsedBase);
  const todayIso = formatDateToISO(today);

  return DAY_LABELS.map((label, idx) => {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dateStr = formatDateToISO(current);
    const dayNumber = current.getDate();
    const monthNumber = String(current.getMonth() + 1).padStart(2, '0');

    return {
      label,
      dayNumber,
      dateStr,
      isToday: dateStr === todayIso,
      isFuture: dateStr > todayIso,
      fullLabel: `${FULL_DAY_NAMES[idx]}, ${String(dayNumber).padStart(2, '0')}/${monthNumber}`,
    };
  });
}

export function getShiftedWeekDate(baseDateStr: string, weekOffset: number): string {
  const date = parseISODate(baseDateStr);
  date.setDate(date.getDate() + weekOffset * 7);
  return formatDateToISO(date);
}

export function validatePlanItemInput(input: PlanItemInput): { valid: boolean; error?: string } {
  if (!input.householdCode || !input.householdCode.trim()) {
    return { valid: false, error: 'Mã nhà không được để trống' };
  }
  if (!input.date || !input.date.trim()) {
    return { valid: false, error: 'Ngày lập Kế hoạch không hợp lệ' };
  }
  if (!input.dishId || !input.dishId.trim()) {
    return { valid: false, error: 'Vui lòng chọn Món ăn' };
  }
  if (!['breakfast', 'lunch', 'dinner'].includes(input.mealType)) {
    return { valid: false, error: 'Bữa ăn không hợp lệ' };
  }
  return { valid: true };
}

export function createPlanItemEntity(
  householdCode: string,
  date: string,
  mealType: MealType,
  dishId: string
): PlanItem {
  const validation = validatePlanItemInput({ householdCode, date, mealType, dishId });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    id: generatePlanItemId(),
    householdCode: householdCode.trim(),
    date: date.trim(),
    mealType,
    dishId: dishId.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function groupPlanItemsByMeal(
  items: PlanItem[],
  date: string
): Record<MealType, PlanItem[]> {
  const result: Record<MealType, PlanItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  for (const item of items) {
    if (item.date === date && result[item.mealType]) {
      result[item.mealType].push(item);
    }
  }

  return result;
}

export function filterPlanItems(
  items: PlanItem[],
  householdCode: string,
  startDate?: string,
  endDate?: string
): PlanItem[] {
  return items.filter((item) => {
    if (item.householdCode !== householdCode) return false;
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });
}

export function addDishesToPlanList(
  items: PlanItem[],
  slot: MealSlot,
  dishIds: string[]
): { updatedItems: PlanItem[]; addedItems: PlanItem[] } {
  const updatedItems = [...items];
  const addedItems: PlanItem[] = [];

  for (const dishId of dishIds) {
    const alreadyExists = updatedItems.some(
      (i) =>
        i.householdCode === slot.householdCode &&
        i.date === slot.date &&
        i.mealType === slot.mealType &&
        i.dishId === dishId
    );

    if (!alreadyExists) {
      const newItem = createPlanItemEntity(slot.householdCode, slot.date, slot.mealType, dishId);
      updatedItems.push(newItem);
      addedItems.push(newItem);
    }
  }

  return { updatedItems, addedItems };
}

export function removeDishFromPlanList(
  items: PlanItem[],
  slot: MealSlot,
  dishId: string
): PlanItem[] {
  return items.filter(
    (i) =>
      !(
        i.householdCode === slot.householdCode &&
        i.date === slot.date &&
        i.mealType === slot.mealType &&
        i.dishId === dishId
      )
  );
}

export interface PlanComment {
  id: string;
  householdCode: string;
  planItemId: string;
  authorNickname: string;
  content: string;
  createdAt: string;
}

export interface PlanCommentInput {
  householdCode: string;
  planItemId: string;
  authorNickname: string;
  content: string;
}

export function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function validateCommentInput(input: PlanCommentInput): { valid: boolean; error?: string } {
  if (!input.householdCode || !input.householdCode.trim()) {
    return { valid: false, error: 'Mã nhà không được để trống' };
  }
  if (!input.planItemId || !input.planItemId.trim()) {
    return { valid: false, error: 'Món ăn trong Kế hoạch không hợp lệ' };
  }
  if (!input.authorNickname || !input.authorNickname.trim()) {
    return { valid: false, error: 'Biệt danh người gửi không được để trống' };
  }
  if (!input.content || !input.content.trim()) {
    return { valid: false, error: 'Nội dung dặn dò không được để trống' };
  }
  return { valid: true };
}

export function createPlanCommentEntity(
  householdCode: string,
  planItemId: string,
  authorNickname: string,
  content: string
): PlanComment {
  const validation = validateCommentInput({ householdCode, planItemId, authorNickname, content });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    id: generateCommentId(),
    householdCode: householdCode.trim(),
    planItemId: planItemId.trim(),
    authorNickname: authorNickname.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function formatCommentTimestamp(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes}, ${day}/${month}`;
  } catch {
    return isoStr;
  }
}

export function filterCommentsForPlanItem(
  comments: PlanComment[],
  householdCode: string,
  planItemId: string
): PlanComment[] {
  return comments
    .filter((c) => c.householdCode === householdCode && c.planItemId === planItemId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function deleteCommentsForPlanItem(
  comments: PlanComment[],
  householdCode: string,
  planItemId: string
): PlanComment[] {
  return comments.filter(
    (c) => !(c.householdCode === householdCode && c.planItemId === planItemId)
  );
}

export function deleteCommentsForPlanItems(
  comments: PlanComment[],
  householdCode: string,
  planItemIds: string[]
): PlanComment[] {
  const idsSet = new Set(planItemIds);
  return comments.filter(
    (c) => !(c.householdCode === householdCode && idsSet.has(c.planItemId))
  );
}

export function getRetentionThresholdDate(baseDateStr: string): string {
  const baseMonday = getMondayOfWeek(parseISODate(baseDateStr));
  return getShiftedWeekDate(formatDateToISO(baseMonday), -2);
}

export function canNavigatePrevWeek(currentDateStr: string, basePlanningDateStr: string): boolean {
  const currentMonday = getMondayOfWeek(parseISODate(currentDateStr));
  const baseMonday = getMondayOfWeek(parseISODate(basePlanningDateStr));
  const targetMondayStr = getShiftedWeekDate(formatDateToISO(currentMonday), -1);
  const targetMonday = parseISODate(targetMondayStr);
  const diffDays = Math.round((targetMonday.getTime() - baseMonday.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= -14;
}

export function pruneExpiredPlanData(
  items: PlanItem[],
  comments: PlanComment[],
  thresholdDate: string
): { remainingItems: PlanItem[]; remainingComments: PlanComment[] } {
  const remainingItems = items.filter((item) => item.date >= thresholdDate);
  const validItemIds = new Set(remainingItems.map((item) => item.id));
  const remainingComments = comments.filter((comment) => validItemIds.has(comment.planItemId));
  return { remainingItems, remainingComments };
}


