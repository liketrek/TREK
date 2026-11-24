import { describe, expect, it } from 'vitest';
import { toggleLineMarker } from './noteLineMarker';

describe('toggleLineMarker', () => {
  it('FE-NOTELINE-001: numbers a new item after the one above instead of starting at 1 again', () => {
    const value = '1. Breakfast\nLunch';
    expect(toggleLineMarker(value, value.length, value.length, 'ordered').value).toBe('1. Breakfast\n2. Lunch');
  });

  it('FE-NOTELINE-002: keeps counting from whatever number the item above has', () => {
    const value = '4. Museum\nDinner';
    expect(toggleLineMarker(value, value.length, value.length, 'ordered').value).toBe('4. Museum\n5. Dinner');
  });

  it('FE-NOTELINE-003: starts at 1 when the line above is no numbered item', () => {
    expect(toggleLineMarker('Meals\nBreakfast', 8, 8, 'ordered').value).toBe('Meals\n1. Breakfast');
    expect(toggleLineMarker('Breakfast', 0, 0, 'ordered').value).toBe('1. Breakfast');
  });

  it('FE-NOTELINE-004: numbers every selected line in order and skips the blank ones', () => {
    const value = 'Breakfast\nLunch\n\nDinner';
    const result = toggleLineMarker(value, 0, value.length, 'ordered');
    expect(result.value).toBe('1. Breakfast\n2. Lunch\n\n3. Dinner');
    expect(result.selection).toEqual([0, result.value.length]);
  });

  it('FE-NOTELINE-005: renumbers a selection that mixes numbered and plain lines', () => {
    const value = '1. Breakfast\n1. Lunch\nDinner';
    expect(toggleLineMarker(value, 0, value.length, 'ordered').value).toBe('1. Breakfast\n2. Lunch\n3. Dinner');
  });

  it('FE-NOTELINE-006: removes the numbers when every selected line already has one', () => {
    const value = '1. Breakfast\n2. Lunch';
    expect(toggleLineMarker(value, 0, value.length, 'ordered').value).toBe('Breakfast\nLunch');
  });

  it('FE-NOTELINE-007: removes the number from a single item, whatever the number is', () => {
    const result = toggleLineMarker('1. a\n12. Dinner', 10, 10, 'ordered');
    expect(result.value).toBe('1. a\nDinner');
    expect(result.selection).toEqual([6, 6]);
  });

  it('FE-NOTELINE-008: bullets and quotes apply to each selected line, without doubling an existing marker', () => {
    const value = 'one\n- two\nthree';
    expect(toggleLineMarker(value, 0, value.length, 'bullet').value).toBe('- one\n- two\n- three');
    expect(toggleLineMarker('one\ntwo', 0, 7, 'quote').value).toBe('> one\n> two');
  });

  it('FE-NOTELINE-009: a selection ending right after a newline leaves the next line alone', () => {
    const value = 'one\ntwo\nthree';
    expect(toggleLineMarker(value, 0, 8, 'bullet').value).toBe('- one\n- two\nthree');
  });

  it('FE-NOTELINE-010: the caret moves with the text on a single line', () => {
    const value = 'first\nsecond';
    expect(toggleLineMarker(value, 8, 8, 'bullet')).toEqual({ value: 'first\n- second', selection: [10, 10] });
  });

  it('FE-NOTELINE-011: an empty line still gets the marker, so a list can be started on it', () => {
    expect(toggleLineMarker('', 0, 0, 'ordered')).toEqual({ value: '1. ', selection: [3, 3] });
    expect(toggleLineMarker('1. Breakfast\n', 13, 13, 'ordered').value).toBe('1. Breakfast\n2. ');
  });
});
