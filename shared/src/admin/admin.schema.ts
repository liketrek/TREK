import { z } from 'zod';

/**
 * Admin API contract for /api/admin (admin-only).
 *
 * The admin service validates most bodies itself (returning {error,status}), so
 * these schemas pin the well-defined ones: user create/update, the permission
 * matrix, invites and the boolean feature toggles. Free-form bodies (OIDC
 * settings, addon config, default user settings) stay with the service.
 */
export const adminUserCreateRequestSchema = z.object({
  email: z.string(),
  password: z.string().optional(),
  username: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
});
export type AdminUserCreateRequest = z.infer<typeof adminUserCreateRequestSchema>;

export const adminPermissionsRequestSchema = z.object({
  permissions: z.record(z.string(), z.unknown()),
});
export type AdminPermissionsRequest = z.infer<typeof adminPermissionsRequestSchema>;

export const adminInviteCreateRequestSchema = z.object({
  max_uses: z.number().optional(),
  expires_in_days: z.number().optional(),
  role: z.enum(['user', 'admin']).optional(),
});
export type AdminInviteCreateRequest = z.infer<typeof adminInviteCreateRequestSchema>;

export const adminFeatureToggleRequestSchema = z.object({
  enabled: z.boolean(),
});
export type AdminFeatureToggleRequest = z.infer<typeof adminFeatureToggleRequestSchema>;
