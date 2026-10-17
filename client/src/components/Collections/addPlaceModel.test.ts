// FE-COMP-ADDPLACEMODEL-001 to FE-COMP-ADDPLACEMODEL-002: reading the loosely typed
// fields of a maps search hit.
import { describe, expect, it } from 'vitest';

import { num, str } from './addPlaceModel';

describe('addPlaceModel', () => {
  it('FE-COMP-ADDPLACEMODEL-001: str keeps a non-empty string and drops everything else', () => {
    expect(str('Elbphilharmonie')).toBe('Elbphilharmonie');
    expect(str('')).toBeUndefined();
    expect(str(42)).toBeUndefined();
    expect(str(null)).toBeUndefined();
    expect(str(undefined)).toBeUndefined();
  });

  it('FE-COMP-ADDPLACEMODEL-002: num reads a number or numeric text, and nothing else', () => {
    expect(num(9.9841)).toBe(9.9841);
    expect(num(0)).toBe(0);
    expect(num('53.5413')).toBe(53.5413);
    expect(num('')).toBeUndefined();
    expect(num(null)).toBeUndefined();
    expect(num(undefined)).toBeUndefined();
    expect(Number.isNaN(num('abc'))).toBe(true);
  });
});
