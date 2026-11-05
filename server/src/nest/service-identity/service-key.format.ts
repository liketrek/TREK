import { z } from 'zod';

const BASE64URL = /^[A-Za-z0-9_-]+$/;

const payloadSchema = z.object({
  i: z.string().min(1).max(64).regex(BASE64URL),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
  q: z.string().min(1).max(32),
});

type ServiceKeyPayload = z.infer<typeof payloadSchema>;

export interface ServiceKey {
  token: string;
  kid: string;
  payload: ServiceKeyPayload;
}

/**
 * Reads `tk1.<kid>.<payload>.<signature>`. The signature is the gate's to
 * check; TREK only needs the expiry and the class it was given, and treats
 * anything that does not read as no key at all.
 */
export function parseServiceKey(token: string): ServiceKey | null {
  const parts = token.trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'tk1') return null;
  const [, kid, body, signature] = parts;
  if (![kid, body, signature].every((part) => BASE64URL.test(part))) return null;
  const payload = payloadSchema.safeParse(decodeSegment(body));
  return payload.success ? { token: parts.join('.'), kid, payload: payload.data } : null;
}

function decodeSegment(segment: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
