import { uniqueViolationKey } from '../../dialect/driver-errors';

/**
 * A write the database refused because another account already holds that
 * email address (in any case, `idx_users_email_lower`) or username. The
 * services check first and answer 409; this is the same answer for the write
 * that lost a race against another one, instead of a 500.
 */
export class UserIdentityTakenError extends Error {
  constructor(readonly field: 'email' | 'username') {
    super(`${field} already taken`);
    this.name = 'UserIdentityTakenError';
  }
}

/**
 * The keys that name the email and the username in a unique violation: SQLite
 * names the column (`users.email`) or the index, Postgres the constraint
 * (`users_email_unique`, `users_username_unique`) or the index
 * (`idx_users_email_lower`).
 */
const EMAIL_KEY = /users\.email|users_email_unique|idx_users_email/;
const USERNAME_KEY = /users\.username|users_username_unique/;

/** Runs a users write, turning a unique violation on email or username into {@link UserIdentityTakenError}. */
export async function guardIdentity<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (err) {
    const key = uniqueViolationKey(err) ?? '';
    if (EMAIL_KEY.test(key)) throw new UserIdentityTakenError('email');
    if (USERNAME_KEY.test(key)) throw new UserIdentityTakenError('username');
    throw err;
  }
}
