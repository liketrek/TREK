/**
 * What a tool answer may carry to the provider. The model plans the trip; it
 * has no use for anyone's e-mail address, a booking's confirmation code or a
 * phone number, so those are hidden, and the bulky fields (pictures inlined as
 * data URLs, route geometry) are dropped before the answer is cut to size
 * (assistant-output.ts). The cards mask their texts with it too.
 */

const HIDDEN = '[hidden]';

/** Keys whose value is personal or a booking secret. */
const SECRET_KEYS = new Set(['email', 'confirmation_number', 'confirmation', 'phone', 'feed_token', 'password']);

/** Keys that cost a lot and tell the model nothing it plans with. */
const DROPPED_KEY = /^(image_url|cover_image|avatar|avatar_url|metadata|place_image|trip_cover)$|geometry/;

// The lookbehind keeps a match from starting inside a run of address characters, so a long run without an @ is read once.
const EMAIL = /(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

type Json = unknown;

function isRecord(value: Json): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The value with secrets hidden, bulky fields dropped and e-mail addresses in free text masked. */
export function redactForProvider(value: Json): Json {
  if (typeof value === 'string') return value.replace(EMAIL, HIDDEN);
  if (Array.isArray(value)) return value.map(redactForProvider);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (DROPPED_KEY.test(key)) continue;
    out[key] = SECRET_KEYS.has(key) && inner !== null && inner !== '' ? HIDDEN : redactForProvider(inner);
  }
  return out;
}
