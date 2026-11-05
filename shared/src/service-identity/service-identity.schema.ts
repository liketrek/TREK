import { z } from 'zod';

/**
 * The installation identity TREK holds towards the liketrek services
 * (places.liketrek.com today): what the issuer there answers, and what the
 * admin card reads back from /api/admin/service-identity.
 */

/** The allowance class a key or the shared legacy pool is counted in. */
export const serviceTierSchema = z.enum(['std', 'hosted', 'own', 'legacy']);
export type ServiceTier = z.infer<typeof serviceTierSchema>;

const wholeNumber = z.number().int().nonnegative();
const unixSeconds = z.number().int().positive();

/**
 * The proof of work a new installation solves before it is given a key. The
 * bounds keep a broken or hostile answer from asking for more memory or time
 * than a small server has (scrypt takes 128 * N * r bytes).
 */
export const serviceChallengeSchema = z.object({
  c: z.string().min(1).max(1024),
  alg: z.literal('scrypt'),
  N: z
    .number()
    .int()
    .min(2)
    .max(65_536)
    .refine((n) => (n & (n - 1)) === 0, 'N must be a power of two'),
  r: z.number().int().min(1).max(8),
  p: z.number().int().min(1).max(4),
  bits: z.number().int().min(0).max(24),
  expires_at: unixSeconds,
});
export type ServiceChallenge = z.infer<typeof serviceChallengeSchema>;

/** A key handed out by registration or renewal; both times are the issuer's clock. */
export const serviceKeyGrantSchema = z.object({
  key: z.string().min(1).max(1024),
  exp: unixSeconds,
  renew_after: unixSeconds,
});
export type ServiceKeyGrant = z.infer<typeof serviceKeyGrantSchema>;

/** GET /v1/quota: today's allowance of the key, or of the legacy pool without one. */
export const serviceQuotaSchema = z.object({
  tier: serviceTierSchema,
  limit: wholeNumber,
  used: wholeNumber,
  remaining: wholeNumber,
  reset_at: unixSeconds,
  per_minute: wholeNumber,
});
export type ServiceQuota = z.infer<typeof serviceQuotaSchema>;

const serviceIdentityStateSchema = z.enum(['connected', 'registering', 'legacy', 'off', 'revoked']);
export type ServiceIdentityState = z.infer<typeof serviceIdentityStateSchema>;

const serviceQuotaViewSchema = z.object({
  limit: wholeNumber,
  used: wholeNumber,
  remaining: wholeNumber,
  resetAt: z.string(),
});
export type ServiceQuotaView = z.infer<typeof serviceQuotaViewSchema>;

/** The liketrek services an installation key opens, in the order the admin card lists them. */
export const SERVICE_NAMES = ['places', 'photon', 'valhalla'] as const;
export const serviceNameSchema = z.enum(SERVICE_NAMES);
export type ServiceName = z.infer<typeof serviceNameSchema>;

/** One service: whether this instance asks it right now, and today's allowance its host reports. */
const serviceAllowanceSchema = z.object({
  service: serviceNameSchema,
  inUse: z.boolean(),
  quota: serviceQuotaViewSchema.nullable(),
});
export type ServiceAllowance = z.infer<typeof serviceAllowanceSchema>;

/** GET /api/admin/service-identity and the answer of its regenerate action. */
export const serviceIdentityStatusSchema = z.object({
  state: serviceIdentityStateSchema,
  tier: serviceTierSchema.nullable(),
  keySource: z.enum(['env', 'registered']).nullable(),
  services: z.array(serviceAllowanceSchema).max(SERVICE_NAMES.length),
  lastSeenAt: z.string().nullable(),
});
export type ServiceIdentityStatus = z.infer<typeof serviceIdentityStatusSchema>;
