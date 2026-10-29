import { z } from 'zod';

/**
 * Sign-in hand-off for the native apps, /api/auth/native.
 *
 * The app shows the TREK web UI inside its own WebView, but SSO and passkeys
 * cannot run there, so it signs in through the system browser instead and has
 * to carry that session back. The app picks a random verifier and sends only
 * its sha256 (the challenge) into the browser. The browser, once signed in,
 * trades the challenge for a one-time code, and the WebView redeems the code
 * together with the verifier. The code travels through a URL scheme any app
 * could claim, so without the verifier it is worth nothing.
 */
const hexSha256 = z.string().regex(/^[0-9a-f]{64}$/);

export const nativeHandoffRequestSchema = z.object({
  challenge: hexSha256,
});
export type NativeHandoffRequest = z.infer<typeof nativeHandoffRequestSchema>;

export const nativeHandoffResponseSchema = z.object({
  code: z.string(),
});
export type NativeHandoffResponse = z.infer<typeof nativeHandoffResponseSchema>;

export const nativeExchangeRequestSchema = z.object({
  code: z.string().min(1).max(128),
  verifier: z.string().min(43).max(128),
});
export type NativeExchangeRequest = z.infer<typeof nativeExchangeRequestSchema>;
