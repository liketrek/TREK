/** A place as the maps search hands it back: loosely typed, every field optional. */
export type MapsPlace = Record<string, unknown>;

/** A non-empty string field of a maps place, or undefined. */
export const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);

/** A numeric field of a maps place, whether it came as a number or as text, or undefined. */
export const num = (v: unknown): number | undefined =>
  typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : undefined;
