import { z } from 'zod';

/**
 * Auth API contract for /api/auth.
 *
 * The auth service does the heavy credential/MFA validation internally (and
 * returns its own {error,status}); these schemas pin the well-defined request
 * bodies the public + account endpoints accept. Login/reset can branch to an
 * MFA step, so password fields stay permissive where the service owns the rules.
 */
export const registerRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
  username: z.string().optional(),
  invite_token: z.string().optional(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
  // "Remember me" — when true the server issues a longer-lived
  // (SESSION_DURATION_REMEMBER) JWT + persistent cookie; when false/absent the
  // session lasts SESSION_DURATION and the cookie is a browser-session cookie.
  remember_me: z.boolean().optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string(),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  token: z.string(),
  // The client sends `new_password` and the service reads `body.new_password`;
  // the field was misnamed `password` here, which broke the client's typing.
  new_password: z.string(),
  mfa_code: z.string().optional(),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const changePasswordRequestSchema = z.object({
  current_password: z.string(),
  new_password: z.string(),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const mfaVerifyLoginRequestSchema = z.object({
  mfa_token: z.string(),
  code: z.string(),
  // Carries the login-form "Remember me" choice through the second (MFA) leg,
  // since the session token is only minted once the MFA code is verified.
  remember_me: z.boolean().optional(),
});
export type MfaVerifyLoginRequest = z.infer<typeof mfaVerifyLoginRequestSchema>;

export const mfaEnableRequestSchema = z.object({
  code: z.string(),
});
export type MfaEnableRequest = z.infer<typeof mfaEnableRequestSchema>;

export const mcpTokenCreateRequestSchema = z.object({
  name: z.string().optional(),
});
export type McpTokenCreateRequest = z.infer<typeof mcpTokenCreateRequestSchema>;
