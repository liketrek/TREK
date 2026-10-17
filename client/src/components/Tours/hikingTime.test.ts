// FE-TOURS-HIKINGTIME-001 to -003: walking time after DIN 33466.
import { describe, expect, it } from 'vitest';
import { hikingTimeMinutes } from './hikingTime';

describe('hikingTimeMinutes', () => {
  it('FE-TOURS-HIKINGTIME-001: on the flat it is 4 km an hour', () => {
    expect(hikingTimeMinutes(8, 0, 0)).toBe(120);
  });

  it('FE-TOURS-HIKINGTIME-002: a short steep climb is ruled by the height, the distance counts by half', () => {
    // 2 km and 450 m up: 1.5 h for the height plus half of 0.5 h for the distance.
    expect(hikingTimeMinutes(2, 450, 0)).toBe(105);
  });

  it('FE-TOURS-HIKINGTIME-003: a long walk is ruled by the distance, the height counts by half', () => {
    // 12 km, 300 m up and 500 m down: 3 h for the distance plus half of 2 h for the height.
    expect(hikingTimeMinutes(12, 300, 500)).toBe(240);
  });
});
