export interface HouseholdStorage {
  getHouseholdCode(): string | null;
  setHouseholdCode(code: string): void;
  getNickname(): string | null;
  setNickname(nickname: string): void;
  clearSession(): void;
}

const HOUSEHOLD_CODE_KEY = 'cooking_plan_household_code';
const NICKNAME_KEY = 'cooking_plan_nickname';

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

  clearSession(): void {
    try {
      localStorage.removeItem(HOUSEHOLD_CODE_KEY);
      localStorage.removeItem(NICKNAME_KEY);
    } catch {
      // Ignored
    }
  }
}

export class InMemoryHouseholdStorage implements HouseholdStorage {
  private householdCode: string | null = null;
  private nickname: string | null = null;

  constructor(initialHouseholdCode?: string, initialNickname?: string) {
    if (initialHouseholdCode) this.householdCode = initialHouseholdCode;
    if (initialNickname) this.nickname = initialNickname;
  }

  getHouseholdCode(): string | null {
    return this.householdCode;
  }

  setHouseholdCode(code: string): void {
    this.householdCode = code;
  }

  getNickname(): string | null {
    return this.nickname;
  }

  setNickname(nickname: string): void {
    this.nickname = nickname;
  }

  clearSession(): void {
    this.householdCode = null;
    this.nickname = null;
  }
}

export const defaultHouseholdStorage = new LocalStorageHouseholdStorage();
