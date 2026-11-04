// FE-PACK-BRINGERS-001 to FE-PACK-BRINGERS-003
import { describe, expect, it } from 'vitest';
import { packingBringerNames } from './packingBringers';

describe('packingBringerNames', () => {
  it('FE-PACK-BRINGERS-001: names the bringer first, then everyone who also brings it', () => {
    const item = {
      owner_username: 'anna',
      contributors: [{ username: 'ben' }, { username: 'carla' }],
    };
    expect(packingBringerNames(item)).toBe('anna, ben, carla');
  });

  it('FE-PACK-BRINGERS-002: names a person once, even when listed twice', () => {
    expect(packingBringerNames({ owner_username: 'anna', contributors: [{ username: 'anna' }] })).toBe('anna');
  });

  it('FE-PACK-BRINGERS-003: copes with an item without a bringer or contributors', () => {
    expect(packingBringerNames({ owner_username: null, contributors: [{ username: 'ben' }] })).toBe('ben');
    expect(packingBringerNames({})).toBe('');
  });
});
