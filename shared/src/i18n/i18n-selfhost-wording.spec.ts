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
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const EN_DIR = path.join(__dirname, 'en');

/** Case-insensitive, and covers the hyphenated, spaced and joined spellings. */
const FORBIDDEN = /self[-\s]?hosted/i;

/**
 * The strings that keep the phrase, each with the reason it is right where it is.
 *
 * Keyed on the translation key rather than the file, so an exemption covers one
 * sentence instead of everything that happens to live beside it. Keep the list
 * short: it is the only way this rule can be worn down.
 */
const ALLOWED: Array<{ key: string; because: string }> = [
  {
    key: 'settings.about.description',
    because:
      'the self-description shown to somebody who set TREK up themselves, and it is ' +
      'accurate for them. A centrally administered install renders ' +
      'settings.about.descriptionManaged instead, so neither reader is told the ' +
      'wrong thing and self-hosters lose nothing.',
  },
  {
    key: 'system_notice.v3_thankyou.body',
    because:
      'a dated message from the author about the project, pinned to one release, ' +
      'and shown only where the managed condition is false',
  },
];

interface Hit {
  file: string;
  line: number;
  key: string;
  text: string;
}

/**
 * Walks the canonical locale and reports every line carrying the phrase,
 * attributed to the key it belongs to.
 *
 * A value can span several lines, so the key is the last one seen at or above
 * the hit rather than something parsed out of the hit itself.
 */
function collect(dir: string): Hit[] {
  const hits: Hit[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue;
    const lines = fs.readFileSync(path.join(dir, name), 'utf8').split('\n');
    let key = '';
    lines.forEach((text, i) => {
      const declared = /^\s*'([^']+)'\s*:/.exec(text);
      if (declared) key = declared[1];
      if (FORBIDDEN.test(text)) hits.push({ file: name, line: i + 1, key, text: text.trim() });
    });
  }
  return hits;
}

describe('canonical locale wording', () => {
  it('I18N-SELFHOST-001: no en/ string calls TREK self-hosted', () => {
    const allowed = new Set(ALLOWED.map((a) => a.key));
    const offenders = collect(EN_DIR)
      .filter((h) => !allowed.has(h.key))
      .map((h) => `${h.file}:${h.line}  [${h.key}]  ${h.text.slice(0, 80)}`);

    expect(offenders).toEqual([]);
  });

  it('I18N-SELFHOST-002: every exemption still covers a string that exists', () => {
    // A stale exemption is worse than none: it reads as a reviewed decision long
    // after the string it covered was rewritten.
    const hits = collect(EN_DIR);
    for (const { key } of ALLOWED) {
      expect(
        hits.some((h) => h.key === key),
        `${key} is exempted but no longer contains the phrase`,
      ).toBe(true);
    }
  });
});
