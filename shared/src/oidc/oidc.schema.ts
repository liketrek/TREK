import { z } from 'zod';

/**
 * OIDC SSO contract for /api/auth/oidc.
 *
 * The flow is redirect-based and carries no request bodies — inputs arrive as
 * query params (the provider callback's code/state/error, the optional invite on
 * /login, and the auth-code on /exchange). These schemas pin those query shapes;
 * the cryptographic verification + provisioning live in the OIDC service.
 */
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
