/** A key in the tk1 shape for a payload of the test's choosing; the signature is never checked by TREK. */
export function serviceKeyTokenFor(payload: { i: string; iat: number; exp: number; q?: string }): string {
  const body = Buffer.from(JSON.stringify({ q: 'std', ...payload })).toString('base64url');
  return `tk1.test.${body}.c2lnbmF0dXJl`;
}
