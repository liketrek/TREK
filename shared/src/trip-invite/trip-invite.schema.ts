import { z } from 'zod';

/**
 * Trip invite-link API contract (#1143).
 *
 * Members with 'share_manage' create/rotate the trip's single invite token
 * under POST /api/trips/:tripId/invite-link. `expires_in_days` accepts
 * number | digits-only string | null | absent on the wire: the client always
 * sends the key (null when no expiry was chosen — see tripInviteApi.createLink),
 * and the legacy raw-body route also took numeric strings from form input (the
 * empty string meaning "no expiry"). The string branch is digits-only so
 * garbage like "7abc" is a 400 instead of silently parseInt-ing to 7; the
 * controller still owns the number coercion (non-positive → no expiry).
 */
export const tripInviteLinkCreateRequestSchema = z.object({
  expires_in_days: z.union([z.number(), z.string().regex(/^\d*$/), z.null()]).optional(),
});
export type TripInviteLinkCreateRequest = z.infer<typeof tripInviteLinkCreateRequestSchema>;
