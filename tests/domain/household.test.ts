import { describe, it, expect } from 'vitest';
import {
  generateHouseholdCode,
  normalizeHouseholdCode,
  isValidHouseholdCode,
  isValidNickname,
  createShareUrl,
  extractJoinCodeFromSearch,
  createHouseholdEntity,
  addMemberToHousehold,
  Household
} from '../../src/domain/household';

describe('Household domain logic', () => {
  it('creates household entity with members array', () => {
    const household = createHouseholdEntity('BEP-892', ['Mẹ', 'Bố']);
    expect(household.code).toBe('BEP-892');
    expect(household.members).toEqual(['Mẹ', 'Bố']);
    expect(household.createdAt).toBeDefined();
  });

  it('adds a new member to household without duplicates and trimmed', () => {
    const household = createHouseholdEntity('BEP-892', ['Mẹ']);
    const updated = addMemberToHousehold(household, '  Bố  ');
    expect(updated.members).toEqual(['Mẹ', 'Bố']);

    // duplicate member is not added again
    const same = addMemberToHousehold(updated, 'Mẹ');
    expect(same.members).toEqual(['Mẹ', 'Bố']);
  });

  it('throws error when adding invalid member name', () => {
    const household = createHouseholdEntity('BEP-892', ['Mẹ']);
    expect(() => addMemberToHousehold(household, '')).toThrow('Tên thành viên không hợp lệ');
    expect(() => addMemberToHousehold(household, '   ')).toThrow('Tên thành viên không hợp lệ');
  });
  it('generates a valid household code formatted as BEP-XXX', () => {
    const code = generateHouseholdCode();
    expect(code).toMatch(/^BEP-\d{3}$/);
    expect(isValidHouseholdCode(code)).toBe(true);
  });

  it('normalizes household codes to uppercase trimmed string', () => {
    expect(normalizeHouseholdCode('  bep-123 ')).toBe('BEP-123');
    expect(normalizeHouseholdCode('bep892')).toBe('BEP892');
  });

  it('validates household codes accurately', () => {
    expect(isValidHouseholdCode('BEP-892')).toBe(true);
    expect(isValidHouseholdCode('HOUSE1')).toBe(true);
    expect(isValidHouseholdCode('')).toBe(false);
    expect(isValidHouseholdCode('A')).toBe(false);
    expect(isValidHouseholdCode('invalid code!')).toBe(false);
  });

  it('validates nicknames accurately', () => {
    expect(isValidNickname('Mẹ')).toBe(true);
    expect(isValidNickname('Bố')).toBe(true);
    expect(isValidNickname(' ')).toBe(false);
    expect(isValidNickname('')).toBe(false);
    expect(isValidNickname('a'.repeat(31))).toBe(false);
  });

  it('creates a proper shareable URL with ?join=CODE', () => {
    const url = createShareUrl('BEP-892', 'https://bep.app');
    expect(url).toBe('https://bep.app?join=BEP-892');
  });

  it('extracts join code from query search string', () => {
    expect(extractJoinCodeFromSearch('?join=BEP-892')).toBe('BEP-892');
    expect(extractJoinCodeFromSearch('?other=1&join=bep-123')).toBe('BEP-123');
    expect(extractJoinCodeFromSearch('?something=else')).toBeNull();
    expect(extractJoinCodeFromSearch('')).toBeNull();
  });
});
