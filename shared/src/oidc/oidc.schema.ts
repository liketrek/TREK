import { z } from 'zod';

/**
 * OIDC SSO contract for /api/auth/oidc.
 *
 * The flow is redirect-based and carries no request bodies — inputs arrive as
 * query params (the provider callback's code/state/error, the optional invite on
 * /login, and the auth-code on /exchange). These schemas pin those query shapes;
 * the cryptographic verification + provisioning live in the OIDC service.
 */
export const oidcLoginQuerySchema = z.object({
  invite: z.string().optional(),
  // '1' → remember-me session (SESSION_DURATION_REMEMBER), '0' → browser-session
  // cookie, absent → the historical default duration. String flags because the
  // value survives a redirect query, not a JSON body.
  remember: z.enum(['0', '1']).optional(),
});
export type OidcLoginQuery = z.infer<typeof oidcLoginQuerySchema>;

export const oidcCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});
export type OidcCallbackQuery = z.infer<typeof oidcCallbackQuerySchema>;

export const oidcExchangeQuerySchema = z.object({
  code: z.string(),
});
export type OidcExchangeQuery = z.infer<typeof oidcExchangeQuerySchema>;

/**
 * The longest logout token accepted. A signed logout token holds a handful of
 * short claims and is well under 2 KB; the cap only keeps a stranger's body
 * from reaching the JWT parser at the size of the global body limit.
 */
export const OIDC_LOGOUT_TOKEN_MAX_LENGTH = 16_384;

/**
 * POST /api/auth/oidc/backchannel-logout, OpenID Connect Back-Channel Logout 1.0
 * section 2.5: the identity provider posts an `application/x-www-form-urlencoded`
 * body with one parameter, the signed `logout_token`. Everything else in the body
 * is ignored, as the spec leaves room for nothing else.
 */
export const oidcBackchannelLogoutRequestSchema = z.object({
  logout_token: z.string().min(1).max(OIDC_LOGOUT_TOKEN_MAX_LENGTH),
});
export type OidcBackchannelLogoutRequest = z.infer<typeof oidcBackchannelLogoutRequestSchema>;

/**
 * The 200 answer (section 2.8). The spec asks for no body; the route answers an
 * empty JSON object, also when no account or session matched the token, so the
 * provider cannot tell which subjects have a TREK account.
 */
export const oidcBackchannelLogoutResponseSchema = z.object({});
export type OidcBackchannelLogoutResponse = z.infer<typeof oidcBackchannelLogoutResponseSchema>;

/** The 400 answer (section 2.8) for a missing or invalid logout token. */
export const oidcBackchannelLogoutErrorSchema = z.object({
  error: z.literal('invalid_request'),
  error_description: z.string(),
});
export type OidcBackchannelLogoutError = z.infer<typeof oidcBackchannelLogoutErrorSchema>;
