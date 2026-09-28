import { describe, it, expect } from 'vitest';
import {
  generateHouseholdCode,
  normalizeHouseholdCode,
  isValidHouseholdCode,
  isValidNickname,
  createShareUrl,
  extractJoinCodeFromSearch
} from '../../src/domain/household';

describe('Household domain logic', () => {
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
