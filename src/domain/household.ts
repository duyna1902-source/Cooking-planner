/**
 * Domain types and logic for Household and Member authentication
 */

export interface HouseholdSession {
  householdCode: string;
  nickname: string;
}

export interface Household {
  code: string;
  members: string[];
  createdAt?: string;
}

export function createHouseholdEntity(code: string, members: string[] = []): Household {
  const normalized = normalizeHouseholdCode(code);
  const cleanMembers = members
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  return {
    code: normalized,
    members: Array.from(new Set(cleanMembers)),
    createdAt: new Date().toISOString(),
  };
}

export function addMemberToHousehold(household: Household, newMemberName: string): Household {
  const trimmed = newMemberName.trim();
  if (!trimmed || !isValidNickname(trimmed)) {
    throw new Error('Tên thành viên không hợp lệ');
  }

  if (household.members.includes(trimmed)) {
    return household;
  }

  return {
    ...household,
    members: [...household.members, trimmed],
  };
}

/**
 * Generate a friendly household code like 'BEP-892'
 */
export function generateHouseholdCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `BEP-${num}`;
}

/**
 * Normalize a household code (trim and uppercase)
 */
export function normalizeHouseholdCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Validate household code format
 */
export function isValidHouseholdCode(code: string): boolean {
  const normalized = normalizeHouseholdCode(code);
  return normalized.length >= 3 && /^[A-Z0-9-]+$/.test(normalized);
}

/**
 * Validate nickname format
 */
export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  return trimmed.length > 0 && trimmed.length <= 30;
}

/**
 * Create shareable join link
 */
export function createShareUrl(householdCode: string, origin = ''): string {
  const cleanCode = normalizeHouseholdCode(householdCode);
  if (!origin && typeof window !== 'undefined' && window.location) {
    origin = `${window.location.origin}${window.location.pathname}`;
  }
  const base = origin.replace(/\/?$/, '');
  return `${base}?join=${encodeURIComponent(cleanCode)}`;
}

/**
 * Extract join code from URL query string or URL object
 */
export function extractJoinCodeFromSearch(search: string): string | null {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const join = params.get('join');
  if (join && isValidHouseholdCode(join)) {
    return normalizeHouseholdCode(join);
  }
  return null;
}
