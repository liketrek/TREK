// FE-FERRATA-PAINT-001 to FE-FERRATA-PAINT-003: the line colours come from the --map-ferrata tokens.
import { afterEach, describe, expect, it } from 'vitest';

import { ferrataPaint, sameFerrataPaint } from './ferrataPaint';

const root = document.documentElement;

afterEach(() => {
  for (const name of [
    '--map-ferrata',
    '--map-ferrata-casing',
    '--map-ferrata-lit',
    '--success',
    '--warning',
    '--danger',
  ])
    root.style.removeProperty(name);
});

describe('ferrataPaint', () => {
  it('FE-FERRATA-PAINT-001: draws the line, its halo and the lit line in the via ferrata tokens', () => {
    root.style.setProperty('--map-ferrata', 'violet');
    root.style.setProperty('--map-ferrata-casing', 'white');
    root.style.setProperty('--map-ferrata-lit', 'indigo');
    expect(ferrataPaint()).toEqual({ line: 'violet', casing: 'white', highlight: 'indigo' });
  });

  it('FE-FERRATA-PAINT-002: never takes the grade colours of the tour line', () => {
    root.style.setProperty('--success', 'green');
    root.style.setProperty('--warning', 'orange');
    root.style.setProperty('--danger', 'crimson');
    const paint = Object.values(ferrataPaint());
    expect(paint).not.toContain('green');
    expect(paint).not.toContain('orange');
    expect(paint).not.toContain('crimson');
  });

  it('FE-FERRATA-PAINT-003: falls back to currentColor where a token is not defined, and compares by colour', () => {
    const paint = ferrataPaint();
    expect(paint).toEqual({ line: 'currentColor', casing: 'currentColor', highlight: 'currentColor' });
    expect(sameFerrataPaint(paint, { ...paint })).toBe(true);
    expect(sameFerrataPaint(paint, { ...paint, highlight: 'red' })).toBe(false);
  });
});
