import { describe, expect, it } from 'vitest';
import { bottomChromePadding, isUnderChrome, PLACE_CARD_OFFSET_PX } from './mapChromePadding';

describe('bottomChromePadding', () => {
  it('MAPCHROME-001: keeps the old allowances when nothing was measured', () => {
    expect(bottomChromePadding({})).toBe(60);
    expect(bottomChromePadding({ hasDayDetail: true })).toBe(280);
    expect(bottomChromePadding({ hasInspector: true })).toBe(320);
    expect(bottomChromePadding({ hasInspector: true, hasDayDetail: true })).toBe(320);
  });

  it('MAPCHROME-002: never goes below the allowance for a short card', () => {
    expect(bottomChromePadding({ hasInspector: true, inspectorHeight: 180 })).toBe(320);
  });

  it('MAPCHROME-003: covers a tall card with room to spare above it (#2991)', () => {
    // A 60vh card on a portrait iPad, 1366px tall.
    const card = 820;
    const padding = bottomChromePadding({ hasInspector: true, inspectorHeight: card });
    expect(padding).toBeGreaterThan(card + PLACE_CARD_OFFSET_PX);
  });

  it('MAPCHROME-004: ignores a measured card that is no longer open', () => {
    expect(bottomChromePadding({ hasInspector: false, inspectorHeight: 820 })).toBe(60);
  });
});

describe('isUnderChrome', () => {
  const size = { x: 1000, y: 1200 };
  const padding = { top: 60, right: 340, bottom: 900, left: 340 };

  it('MAPCHROME-005: reads the open strip between the panels as clear', () => {
    expect(isUnderChrome({ x: 500, y: 200 }, size, padding)).toBe(false);
    expect(isUnderChrome({ x: 500, y: 300 }, size, padding)).toBe(false);
  });

  it('MAPCHROME-006: reads a point below the card top, beside a panel or under the header as covered', () => {
    expect(isUnderChrome({ x: 500, y: 301 }, size, padding)).toBe(true);
    expect(isUnderChrome({ x: 200, y: 200 }, size, padding)).toBe(true);
    expect(isUnderChrome({ x: 700, y: 200 }, size, padding)).toBe(true);
    expect(isUnderChrome({ x: 500, y: 40 }, size, padding)).toBe(true);
  });
});
