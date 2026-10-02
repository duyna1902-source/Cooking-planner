import {
  Household,
  createHouseholdEntity,
  addMemberToHousehold,
  normalizeHouseholdCode,
} from '../domain/household';

export interface HouseholdRepository {
  readonly isOnline?: boolean;
  getHousehold(code: string): Promise<Household | null>;
  saveHousehold(household: Household): Promise<Household>;
  getMembers(code: string): Promise<string[]>;
  addMember(code: string, memberName: string): Promise<Household>;
  subscribe?(code: string, callback: () => void): () => void;
}

export class InMemoryHouseholdRepository implements HouseholdRepository {
  readonly isOnline = false;
  private households: Map<string, Household> = new Map();

  constructor(initialHouseholds: Household[] = []) {
    for (const h of initialHouseholds) {
      this.households.set(normalizeHouseholdCode(h.code), { ...h });
    }
  }

  async getHousehold(code: string): Promise<Household | null> {
    const normalized = normalizeHouseholdCode(code);
    const found = this.households.get(normalized);
    return found ? { ...found, members: [...found.members] } : null;
  }

  async saveHousehold(household: Household): Promise<Household> {
    const normalized = normalizeHouseholdCode(household.code);
    const toSave: Household = {
      ...household,
      code: normalized,
      members: [...household.members],
    };
    this.households.set(normalized, toSave);
    return { ...toSave, members: [...toSave.members] };
  }

  async getMembers(code: string): Promise<string[]> {
    const household = await this.getHousehold(code);
    return household ? [...household.members] : [];
  }

  async addMember(code: string, memberName: string): Promise<Household> {
    const normalized = normalizeHouseholdCode(code);
    let household = await this.getHousehold(normalized);
    if (!household) {
      household = createHouseholdEntity(normalized, [memberName]);
    } else {
      household = addMemberToHousehold(household, memberName);
    }
    return this.saveHousehold(household);
  }

  subscribe?(_code: string, _callback: () => void): () => void {
    return () => {};
  }
}

export class LocalStorageHouseholdRepository implements HouseholdRepository {
  readonly isOnline = false;

  private getStorageKey(code: string): string {
    return `cooking_plan_household_${normalizeHouseholdCode(code)}`;
  }

  private readHousehold(code: string): Household | null {
    try {
      const data = localStorage.getItem(this.getStorageKey(code));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private writeHousehold(household: Household): void {
    try {
      localStorage.setItem(this.getStorageKey(household.code), JSON.stringify(household));
    } catch {
      // Ignored in quota/restricted cases
    }
  }

  async getHousehold(code: string): Promise<Household | null> {
    const found = this.readHousehold(code);
    return found ? { ...found, members: [...found.members] } : null;
  }

  async saveHousehold(household: Household): Promise<Household> {
    const normalized = normalizeHouseholdCode(household.code);
    const toSave: Household = {
      ...household,
      code: normalized,
      members: [...household.members],
    };
    this.writeHousehold(toSave);
    return { ...toSave, members: [...toSave.members] };
  }

  async getMembers(code: string): Promise<string[]> {
    const household = await this.getHousehold(code);
    return household ? [...household.members] : [];
  }

  async addMember(code: string, memberName: string): Promise<Household> {
    const normalized = normalizeHouseholdCode(code);
    let household = await this.getHousehold(normalized);
    if (!household) {
      household = createHouseholdEntity(normalized, [memberName]);
    } else {
      household = addMemberToHousehold(household, memberName);
    }
    return this.saveHousehold(household);
  }

  subscribe?(_code: string, _callback: () => void): () => void {
    return () => {};
  }
}

export const defaultHouseholdRepository = new LocalStorageHouseholdRepository();
