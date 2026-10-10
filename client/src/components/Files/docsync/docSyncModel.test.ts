// FE-DOCSYNC-MODEL-001 to FE-DOCSYNC-MODEL-004: the lane switch and the folder name the
// desktop document sync dialog and the phone sheet share.
import { describe, expect, it } from 'vitest';

import { slugFor, toggledDirection } from './docSyncModel';

describe('toggledDirection', () => {
  it('FE-DOCSYNC-MODEL-001: switching a lane off on a two way binding leaves the other one', () => {
    expect(toggledDirection('both', 'push')).toBe('pull');
    expect(toggledDirection('both', 'pull')).toBe('push');
  });

  it('FE-DOCSYNC-MODEL-002: switching the missing lane on makes it two way, the last lane cannot go', () => {
    expect(toggledDirection('push', 'pull')).toBe('both');
    expect(toggledDirection('pull', 'push')).toBe('both');
    expect(toggledDirection('push', 'push')).toBeNull();
    expect(toggledDirection('pull', 'pull')).toBeNull();
  });
});

describe('slugFor', () => {
  it('FE-DOCSYNC-MODEL-003: folds the title to lower case ASCII words joined by dashes, with the trip id', () => {
    expect(slugFor('Côte d’Azur  2026!', 7)).toBe('cote-d-azur-2026-7');
    expect(slugFor('  --Tokyo--  ', '12')).toBe('tokyo-12');
  });

  it('FE-DOCSYNC-MODEL-004: no usable title falls back to trek, and long titles are cut at 40', () => {
    expect(slugFor(undefined, 3)).toBe('trek-3');
    expect(slugFor('東京', 3)).toBe('trek-3');
    expect(slugFor('a'.repeat(60), 1)).toBe(`${'a'.repeat(40)}-1`);
  });
});
