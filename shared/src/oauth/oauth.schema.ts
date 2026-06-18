import { z } from 'zod';

/**
 * OAuth 2.1 server contract for /oauth/* (public) + /api/oauth/* (SPA).
 *
 * The token endpoint accepts JSON or form-encoded bodies across three grant
 * types, so its body stays permissive (the service enforces grant-specific
 * rules + the RFC error codes). These schemas pin the consent submit and the
 * client-create body the SPA sends.
 */
export const oauthTokenRequestSchema = z
  .object({
    grant_type: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    code: z.string().optional(),
    redirect_uri: z.string().optional(),
    code_verifier: z.string().optional(),
    refresh_token: z.string().optional(),
    scope: z.string().optional(),
    resource: z.string().optional(),
  })
  .passthrough();
export type OauthTokenRequest = z.infer<typeof oauthTokenRequestSchema>;

export const oauthConsentRequestSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.string(),
  state: z.string().optional(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
  approved: z.boolean(),
  resource: z.string().optional(),
});
export type OauthConsentRequest = z.infer<typeof oauthConsentRequestSchema>;

export const oauthClientCreateRequestSchema = z.object({
  name: z.string().min(1),
  redirect_uris: z.array(z.string()).optional(),
  allowed_scopes: z.array(z.string()),
  allows_client_credentials: z.boolean().optional(),
});
export type OauthClientCreateRequest = z.infer<typeof oauthClientCreateRequestSchema>;
