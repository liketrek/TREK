/**
 * Reads the canonical locale and reports every line that calls TREK self-hosted.
 *
 * Plain .mjs and outside `src/` for the same reason as i18n-parity.mjs next to
 * it: shared's typecheck runs with only shared's own dependencies installed
 * (`npm ci --workspace shared`), so there is no @types/node and a `node:fs`
 * import inside `src/` fails to compile. The spec imports this the same way the
 * parity spec imports its script.
 *
 * Runnable on its own — `node scripts/i18n-selfhost-wording.mjs` prints the hits
 * — which is what you want when a CI failure names a line you have to find.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'en');

/** Case-insensitive, and covers the hyphenated, spaced and joined spellings. */
export const FORBIDDEN = /self[-\s]?hosted/i;

/**
 * The strings that keep the phrase, each with the reason it is right where it is.
 *
 * Keyed on the translation key rather than the file, so an exemption covers one
 * sentence instead of everything that happens to live beside it. Keep the list
 * short: it is the only way this rule can be worn down.
 */
export const ALLOWED = [
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

/**
 * Walks the canonical locale and reports every line carrying the phrase,
 * attributed to the key it belongs to.
 *
 * A value can span several lines, so the key is the last one seen at or above
 * the hit rather than something parsed out of the hit itself.
 */
export function collectSelfhostHits(dir = EN_DIR) {
  const hits = [];
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

/** Hits that no exemption covers — the ones that fail the build. */
export function findOffenders(dir = EN_DIR) {
  const allowed = new Set(ALLOWED.map((a) => a.key));
  return collectSelfhostHits(dir).filter((h) => !allowed.has(h.key));
}

// pathToFileURL rather than a `file://` template: on Windows argv[1] arrives with
// backslashes and a drive letter, so the plain comparison never matches and the
// script silently does nothing when run by hand.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const offenders = findOffenders();
  for (const h of offenders) {
    console.log(`${h.file}:${h.line}  [${h.key}]  ${h.text.slice(0, 80)}`);
  }
  console.log(offenders.length === 0 ? 'Wording: OK' : `Wording: ${offenders.length} offender(s)`);
  process.exit(offenders.length === 0 ? 0 : 1);
}
