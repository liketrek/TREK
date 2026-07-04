import fs from 'node:fs';

/**
 * Read + parse a JSON file, tolerating a UTF-8 BOM (0xFEFF) — Windows editors
 * love to add one, and a bare JSON.parse then fails with a cryptic
 * "Unexpected token" that points at an invisible character.
 */
export function readJsonFile<T = unknown>(p: string): T {
  const text = fs.readFileSync(p, 'utf8');
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text) as T;
}
