import { StorageInvalidKeyError } from './storage.types';

/**
 * Central key validation — the ONE place storage keys are checked, replacing
 * the scattered per-route guards (`path.basename` + `startsWith` shapes in
 * files.service.ts / platform.routes.ts / journey-public.controller.ts) as
 * call sites migrate. Drivers still confine resolved paths to their root as
 * defense in depth, but no driver or route re-implements these rules.
 *
 * Rejected: `..` segments, absolute paths, backslashes, empty segments,
 * leading-dot segments (matches `express.static`'s default
 * `dotfiles: 'ignore'` and keeps the `.tmp` spool unreachable), and control
 * characters. Spaces are valid — legacy `photos/<filename>` keys are
 * user-named flat files.
 */

const MAX_KEY_LENGTH = 1024;

function hasControlChars(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) as number;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function isValidKey(key: string): boolean {
  if (!key || key.length > MAX_KEY_LENGTH) return false;
  if (key.includes('\\') || hasControlChars(key)) return false;
  for (const segment of key.split('/')) {
    if (segment === '' || segment.startsWith('.')) return false;
  }
  return true;
}

export function assertValidKey(key: string): void {
  if (!isValidKey(key)) throw new StorageInvalidKeyError(key);
}

/** Prefixes additionally allow `''` (list everything) and a trailing `/`. */
export function isValidPrefix(prefix: string): boolean {
  if (prefix === '') return true;
  return isValidKey(prefix.endsWith('/') ? prefix.slice(0, -1) : prefix);
}

export function assertValidPrefix(prefix: string): void {
  if (!isValidPrefix(prefix)) throw new StorageInvalidKeyError(prefix);
}
