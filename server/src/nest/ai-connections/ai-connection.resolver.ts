import type { AiConnectionScope, AiConnectionStatus, AiPolicy } from '@trek/shared';

/** What the policy needs to know of a connection. */
interface PickableConnection {
  status: AiConnectionStatus | string;
}

/**
 * Which connection a user's assistant runs on, and who pays for it.
 *
 * - `instance`: only the admin's; a user's own is never used.
 * - `user`: only the user's own.
 * - `instance_or_user`: the user's own when there is one, else the admin's.
 *
 * A connection the user signed out of counts as none. One that needs a new
 * sign-in or a new key is still the one picked, never silently passed over for
 * the other: the user then sees why their own does not work instead of using
 * the instance's without knowing.
 */
export function pickConnection<T extends PickableConnection>(
  policy: AiPolicy,
  own: T | null,
  instance: T | null,
): { connection: T; paidBy: AiConnectionScope } | null {
  const usableOwn = own && own.status !== 'signed_out' ? own : null;
  if (policy !== 'instance' && usableOwn) return { connection: usableOwn, paidBy: 'user' };
  if (policy !== 'user' && instance) return { connection: instance, paidBy: 'instance' };
  return null;
}
