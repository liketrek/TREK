import { createHash } from 'node:crypto';

/**
 * The SHA-256 of a stored value, hex. The origin of a place's field is kept
 * with the hash of the value it describes, so a value changed by any path that
 * did not record an origin (a migration, a direct SQL fix, an older plugin SDK,
 * a restore) no longer matches and counts as unknown.
 */
export function valueHash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
