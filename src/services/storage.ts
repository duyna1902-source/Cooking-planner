import {
  normalizeHouseholdCode,
  isValidHouseholdCode,
} from '../domain/household';

export type HouseholdNavigationState =
  | { status: 'choosing_household' }
  | { status: 'choosing_member'; householdCode: string }
  | { status: 'selected'; householdCode: string; memberId: string };

export interface HouseholdStorage {
  getHouseholdCode(): string | null;
  setHouseholdCode(code: string): void;
  getNickname(): string | null;
  setNickname(nickname: string): void;
  getNavigationState(): HouseholdNavigationState;
  setNavigationState(state: HouseholdNavigationState): void;
  getSavedHouseholds(): string[];
  saveHousehold(code: string): void;
  removeSavedHousehold(code: string): void;
  clearSession(): void;
}

const HOUSEHOLD_CODE_KEY = 'cooking_plan_household_code';
const NICKNAME_KEY = 'cooking_plan_nickname';
const NAVIGATION_STATE_KEY = 'cooking_plan_navigation_state';
const SAVED_HOUSEHOLDS_KEY = 'cooking_plan_saved_households';

export class LocalStorageHouseholdStorage implements HouseholdStorage {
  getHouseholdCode(): string | null {
    try {
      return localStorage.getItem(HOUSEHOLD_CODE_KEY);
    } catch {
      return null;
    }
  }

  setHouseholdCode(code: string): void {
    try {
      localStorage.setItem(HOUSEHOLD_CODE_KEY, code);
      this.setNavigationState({ status: 'choosing_member', householdCode: code });
    } catch {
      // Ignored in restricted environments
    }
  }

  getNickname(): string | null {
    try {
      return localStorage.getItem(NICKNAME_KEY);
    } catch {
      return null;
    }
  }

  setNickname(nickname: string): void {
    try {
      localStorage.setItem(NICKNAME_KEY, nickname);
    } catch {
      // Ignored in restricted environments
    }
  }

  getNavigationState(): HouseholdNavigationState {
    try {
      const raw = localStorage.getItem(NAVIGATION_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.status === 'choosing_household') {
            return { status: 'choosing_household' };
          }
          if (
            parsed.status === 'choosing_member' &&
            typeof parsed.householdCode === 'string' &&
            parsed.householdCode.trim()
          ) {
            return { status: 'choosing_member', householdCode: parsed.householdCode.trim() };
          }
          if (
            parsed.status === 'selected' &&
            typeof parsed.householdCode === 'string' &&
            parsed.householdCode.trim() &&
            typeof parsed.memberId === 'string' &&
            parsed.memberId.trim()
          ) {
            return {
              status: 'selected',
              householdCode: parsed.householdCode.trim(),
              memberId: parsed.memberId.trim(),
            };
          }
        }
      }
    } catch {
      // Ignored on parse error or localStorage error
    }

    // Backwards compatibility: if storage contains only the old cooking_plan_household_code
    const legacyCode = this.getHouseholdCode();
    if (legacyCode && legacyCode.trim()) {
      return { status: 'choosing_member', householdCode: legacyCode.trim() };
    }

    return { status: 'choosing_household' };
  }

  setNavigationState(state: HouseholdNavigationState): void {
    try {
      localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
      if (state.status === 'choosing_household') {
        localStorage.removeItem(HOUSEHOLD_CODE_KEY);
      } else {
        localStorage.setItem(HOUSEHOLD_CODE_KEY, state.householdCode);
      }
    } catch {
      // Ignored in restricted environments
    }
  }

  getSavedHouseholds(): string[] {
    try {
      const raw = localStorage.getItem(SAVED_HOUSEHOLDS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && isValidHouseholdCode(item))
            .map(normalizeHouseholdCode);
        }
      }
    } catch {
      // Ignored on parse error or localStorage error
    }

    // Backwards compatibility: check legacy code if saved list key was never initialized
    const legacyCode = this.getHouseholdCode();
    if (legacyCode && isValidHouseholdCode(legacyCode)) {
      return [normalizeHouseholdCode(legacyCode)];
    }

    return [];
  }

  saveHousehold(code: string): void {
    const normalized = normalizeHouseholdCode(code);
    if (!isValidHouseholdCode(normalized)) return;

    try {
      const current = this.getSavedHouseholds().filter((c) => c !== normalized);
      const updated = [normalized, ...current];
      localStorage.setItem(SAVED_HOUSEHOLDS_KEY, JSON.stringify(updated));
    } catch {
      // Ignored in restricted environments
    }
  }

  removeSavedHousehold(code: string): void {
    const normalized = normalizeHouseholdCode(code);
    try {
      const current = this.getSavedHouseholds().filter((c) => c !== normalized);
      localStorage.setItem(SAVED_HOUSEHOLDS_KEY, JSON.stringify(current));
    } catch {
      // Ignored
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem(HOUSEHOLD_CODE_KEY);
      localStorage.removeItem(NICKNAME_KEY);
      localStorage.removeItem(NAVIGATION_STATE_KEY);
    } catch {
      // Ignored
    }
  }
}

export class InMemoryHouseholdStorage implements HouseholdStorage {
  private householdCode: string | null = null;
  private nickname: string | null = null;
  private navigationState: HouseholdNavigationState | null = null;
  private savedHouseholds: string[] | null = null;

  constructor(
    initialHouseholdCode?: string,
    initialNickname?: string,
    initialNavigationState?: HouseholdNavigationState,
    initialSavedHouseholds?: string[]
  ) {
    if (initialHouseholdCode) this.householdCode = initialHouseholdCode;
    if (initialNickname) this.nickname = initialNickname;
    if (initialSavedHouseholds) {
      this.savedHouseholds = [...initialSavedHouseholds];
    }
    if (initialNavigationState) {
      this.setNavigationState(initialNavigationState);
    } else if (initialHouseholdCode && initialHouseholdCode.trim()) {
      this.navigationState = {
        status: 'choosing_member',
        householdCode: initialHouseholdCode.trim(),
      };
    }
  }

  getHouseholdCode(): string | null {
    if (this.navigationState) {
      if (this.navigationState.status === 'choosing_household') {
        return null;
      }
      return this.navigationState.householdCode;
    }
    return this.householdCode;
  }

  setHouseholdCode(code: string): void {
    this.householdCode = code;
    this.navigationState = { status: 'choosing_member', householdCode: code };
  }

  getNickname(): string | null {
    return this.nickname;
  }

  setNickname(nickname: string): void {
    this.nickname = nickname;
  }

  getNavigationState(): HouseholdNavigationState {
    if (this.navigationState) {
      return this.navigationState;
    }
    if (this.householdCode && this.householdCode.trim()) {
      return { status: 'choosing_member', householdCode: this.householdCode.trim() };
    }
    return { status: 'choosing_household' };
  }

  setNavigationState(state: HouseholdNavigationState): void {
    this.navigationState = state;
    if (state.status === 'choosing_household') {
      this.householdCode = null;
    } else {
      this.householdCode = state.householdCode;
    }
  }

  getSavedHouseholds(): string[] {
    if (this.savedHouseholds !== null) {
      return [...this.savedHouseholds];
    }
    if (this.householdCode && isValidHouseholdCode(this.householdCode)) {
      return [normalizeHouseholdCode(this.householdCode)];
    }
    return [];
  }

  saveHousehold(code: string): void {
    const normalized = normalizeHouseholdCode(code);
    if (!isValidHouseholdCode(normalized)) return;

    const current = this.getSavedHouseholds().filter((c) => c !== normalized);
    this.savedHouseholds = [normalized, ...current];
  }

  removeSavedHousehold(code: string): void {
    const normalized = normalizeHouseholdCode(code);
    const current = this.getSavedHouseholds().filter((c) => c !== normalized);
    this.savedHouseholds = current;
  }

  clearSession(): void {
    this.householdCode = null;
    this.nickname = null;
    this.navigationState = { status: 'choosing_household' };
  }
}

export const defaultHouseholdStorage = new LocalStorageHouseholdStorage();
