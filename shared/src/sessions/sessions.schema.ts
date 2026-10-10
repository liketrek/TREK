import { z } from 'zod';

/**
 * Sign-in sessions contract for /api/auth/sessions.
 *
 * Every session token the server issues carries an id (the JWT `jti`) and a
 * row in `user_sessions`, so a user can see where they are signed in and end
 * one of those sessions, or all but the current one. Tokens issued before
 * sessions were tracked carry no id; they are not listed and stay valid until
 * they expire or the password changes.
 *
 * Timestamps are the database text the rest of the API emits
 * (`YYYY-MM-DD HH:MM:SS`, UTC).
 */
export const userSessionIdSchema = z.uuid();
export type UserSessionId = z.infer<typeof userSessionIdSchema>;

export const userSessionSchema = z.object({
  id: userSessionIdSchema,
  created_at: z.string(),
  last_seen_at: z.string(),
  expires_at: z.string(),
  /** The browser's User-Agent at sign-in, cut to 256 characters; null when it sent none. */
  user_agent: z.string().nullable(),
  /** True for the session the request itself was made with. */
  current: z.boolean(),
});
export type UserSession = z.infer<typeof userSessionSchema>;

export const userSessionListResponseSchema = z.object({
  sessions: z.array(userSessionSchema),
  /**
   * False when the request was made with a token issued before sessions were
   * tracked: no row is `current` then, and signing out the others leaves that
   * token alone too.
   */
  current_tracked: z.boolean(),
});
export type UserSessionListResponse = z.infer<typeof userSessionListResponseSchema>;

export const userSessionRevokeParamsSchema = z.object({
  id: userSessionIdSchema,
});
export type UserSessionRevokeParams = z.infer<typeof userSessionRevokeParamsSchema>;

export const userSessionRevokeResponseSchema = z.object({
  success: z.literal(true),
});
export type UserSessionRevokeResponse = z.infer<typeof userSessionRevokeResponseSchema>;

export const userSessionRevokeOthersResponseSchema = z.object({
  success: z.literal(true),
  /** How many sessions were signed out. */
  revoked: z.number().int().nonnegative(),
});
export type UserSessionRevokeOthersResponse = z.infer<typeof userSessionRevokeOthersResponseSchema>;
