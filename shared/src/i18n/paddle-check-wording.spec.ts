/**
 * The paddle checklist (PAD-06, PAD-09) is a planning aid, never a safety or
 * legal clearance, so its strings must not claim one: no "safe", "cleared" or
 * "passable" on a status, a badge or a choice. Only the strings that say what
 * the checklist is not, and the safety note itself, may name safety.
 *
 * Scoped to en and de, the languages the wording was written in; the other
 * locales are translated from them.
 */
import de from './de/tours';
import en from './en/tours';

import { describe, expect, it } from 'vitest';

const EXEMPT = ['tours.paddle.check.notClearance', 'tours.paddle.check.bansInfo'];
const isChecked = (key: string) =>
  key.startsWith('tours.paddle.check.') && !EXEMPT.includes(key) && !key.startsWith('tours.paddle.safety.');

function claims(strings: Record<string, string>, pattern: RegExp): string[] {
  return Object.entries(strings)
    .filter(([key, value]) => isChecked(key) && pattern.test(value))
    .map(([key, value]) => `${key}: ${value}`);
}

describe('paddle checklist wording', () => {
  it('PCW-001: no en checklist string claims the water is safe, cleared or passable', () => {
    expect(claims(en, /\b(safe|safety|cleared|clearance|verified|passable|free of)\b/i)).toEqual([]);
  });

  it('PCW-002: no de checklist string claims the water is safe, cleared or passable', () => {
    expect(claims(de, /\b(sicher|sicherheit|freigegeben|freigabe|befahrbar|frei)\b/i)).toEqual([]);
  });

  it('PCW-003: the checklist says what it is not, and the safety note exists, in both', () => {
    for (const strings of [en, de]) {
      expect(strings['tours.paddle.check.notClearance']).toBeTruthy();
      expect(strings['tours.paddle.safety.text']).toBeTruthy();
    }
    expect(en['tours.paddle.check.notClearance']).toMatch(/\bno safety or legal clearance\b/);
    expect(de['tours.paddle.check.notClearance']).toMatch(/keine Sicherheits- oder Rechtsfreigabe/);
  });
});
