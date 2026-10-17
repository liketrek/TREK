/**
 * Reads the locale tables as text, for the i18n scripts beside this file.
 *
 * Plain .mjs outside `src/` for the reason i18n-parity.mjs gives: shared's
 * typecheck runs without @types/node, and the CI parity job runs these scripts
 * with no install at all. The tables are parsed rather than imported so the
 * checks stay synchronous and see the `// en-fallback` markers, which an
 * import would strip.
 *
 * A value is one string literal, single or double quoted, on the key's line or
 * the next one (the two shapes Prettier writes). Anything else after a key (a
 * concatenation, a template literal, a call) is an error rather than a skipped
 * key: a check that silently reads less than the file holds passes for the
 * wrong reason.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const I18N_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');

export const FALLBACK_MARKER = '// en-fallback';

/**
 * The marker a translator leaves on a value that is the locale's own word and
 * happens to be spelled as in en (German "Status", French "Transport"). The
 * untranslated ratchet honours it only in Latin-script locales.
 */
export const SAME_MARKER = '// same-as-en';

/** A root given as a file URL (what a spec can build without node types) or a path. */
export const asPath = (root) => (root instanceof URL ? fileURLToPath(root) : root);

/** Every locale folder (externalNotifications is a barrel module, not a locale). */
export function listLocales(root = I18N_ROOT) {
  const dir = asPath(root);
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .filter((name) => name !== 'externalNotifications');
}

/** The domain files of one locale, sorted. */
export function listDomainFiles(locale, root = I18N_ROOT) {
  return readdirSync(join(asPath(root), locale))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
}

const KEY_LINE_RE = /^\s*'([a-z][a-zA-Z0-9.\-_:]*)'\s*:(.*)$/;

const ESCAPES = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' };

/** The value of a JS string literal body (between the quotes). */
export function decodeLiteral(body) {
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r?\n|[\s\S])/g, (_, esc) => {
    if (esc[0] === 'u' && esc.length > 1) return String.fromCodePoint(parseInt(esc.replace(/[u{}]/g, ''), 16));
    if (esc[0] === 'x' && esc.length === 3) return String.fromCharCode(parseInt(esc.slice(1), 16));
    if (esc === '\n' || esc === '\r\n') return '';
    return ESCAPES[esc] ?? esc;
  });
}

/** Reads one quoted literal at the start of `text`; null when `text` does not start with one. */
function readLiteral(text) {
  const quote = text[0];
  if (quote !== "'" && quote !== '"') return null;
  for (let i = 1; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === '\n') return null;
    if (text[i] === quote) return { value: decodeLiteral(text.slice(1, i)), rest: text.slice(i + 1) };
  }
  return null;
}

/**
 * Every top-level entry of one table's source: key, value, whether the
 * declaration carries the fallback marker (`marked`) or the same-as-en
 * marker (`same`), and the line it starts on.
 * Throws with file and line on anything it cannot read.
 */
export function parseCatalog(source, label = 'catalogue') {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(KEY_LINE_RE);
    if (!match) continue;
    const [, key, after] = match;
    let text = after.trim();
    let end = i;
    if (text === '') {
      end = i + 1;
      text = (lines[end] ?? '').trim();
    }
    const literal = readLiteral(text);
    const tail = literal?.rest.trim() ?? '';
    if (!literal || !/^(,|\})?\s*(\/\/.*)?$/.test(tail)) {
      throw new Error(`${label}:${i + 1}: '${key}' is not a single string literal`);
    }
    entries.push({
      key,
      value: literal.value,
      marked: tail.includes(FALLBACK_MARKER),
      same: tail.includes(SAME_MARKER),
      line: i + 1,
    });
    i = end;
  }
  return entries;
}

/** The entries of `locale/file`, read from disk. */
export function readCatalog(locale, file, root = I18N_ROOT) {
  return parseCatalog(readFileSync(join(asPath(root), locale, file), 'utf8'), `${locale}/${file}`);
}
