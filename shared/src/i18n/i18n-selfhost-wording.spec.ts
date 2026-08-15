/**
 * The canonical locale must not describe TREK as self-hosted.
 *
 * Not a style rule. The same build runs on an install its admin set up and on
 * one somebody else operates, and a string that assumes the first is simply
 * wrong on the second: it tells a reader to use their own server, check their
 * own logs, or update something they cannot reach.
 *
 * This exists because the parity check cannot catch it. That one compares the
 * file set and the top-level keys across all 23 locales and never looks at a
 * value, so re-wording a string is invisible to CI and so is putting the old
 * wording back.
 *
 * Scoped to `en/` on purpose: it is the canonical source every translation is
 * made from. Ordering the other 22 into line with a regex would mean editing
 * languages nobody here can read, and a translation still carrying the older
 * phrasing is a translation lagging behind, not a broken build.
 *
 * The walk itself lives in scripts/, like the parity check next door — shared
 * typechecks with only its own dependencies installed, so `node:fs` cannot be
 * imported from `src/`.
 */
// @ts-expect-error — plain .mjs script with no .d.ts; import as JS module.
import { ALLOWED, collectSelfhostHits, findOffenders } from '../../scripts/i18n-selfhost-wording.mjs';

import { describe, it, expect } from 'vitest';

interface Hit {
  file: string;
  line: number;
  key: string;
  text: string;
}

describe('canonical locale wording', () => {
  it('I18N-SELFHOST-001: no en/ string calls TREK self-hosted', () => {
    const offenders = (findOffenders() as Hit[]).map((h) => `${h.file}:${h.line}  [${h.key}]  ${h.text.slice(0, 80)}`);

    expect(offenders).toEqual([]);
  });

  it('I18N-SELFHOST-002: every exemption still covers a string that exists', () => {
    // A stale exemption is worse than none: it reads as a reviewed decision long
    // after the string it covered was rewritten.
    const hits = collectSelfhostHits() as Hit[];
    for (const { key } of ALLOWED as Array<{ key: string }>) {
      expect(
        hits.some((h) => h.key === key),
        `${key} is exempted but no longer contains the phrase`,
      ).toBe(true);
    }
  });
});
