import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

interface UserEmailRow {
  id: number;
  email: string;
}

interface AuditRow {
  user_id: number | null;
  resource: string | null;
  details: string | null;
}

/** The parsed `details` of an audit row, or null for an empty or broken one. */
function detailsOf(row: AuditRow): Record<string, unknown> | null {
  if (!row.details) return null;
  try {
    const parsed: unknown = JSON.parse(row.details);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Remembers whether an account's email address is one the account typed in
 * itself.
 *
 * An SSO sign-in that matches no linked account falls back to the email
 * address and links the provider identity to whichever account holds it. That
 * address proves nothing when the account chose it at signup or in its profile
 * settings: anyone could put a colleague's address on their own account and
 * receive the colleague's first SSO sign-in. `email_self_asserted` is 1 for
 * such an address and keeps the sign-in from linking to it; an address an admin
 * set, or one the provider created the account with, stays 0.
 *
 * Existing accounts start at 0, so instances keep linking the way they did.
 * The exception is an account whose address provably moved away from the one
 * it registered with (its `user.register` audit row) without an admin ever
 * editing its email (an `admin.user_update` row naming `email`): only the
 * account itself can have changed it. The audit details are JSON text, read
 * and compared here rather than in SQL.
 */
export class Migration20200101042800_an_email_the_account_typed_in_itself extends Migration {
  override name = 'Migration20200101042800_an_email_the_account_typed_in_itself';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'email_self_asserted', 'email_self_asserted INTEGER NOT NULL DEFAULT 0');

    const registrations = (await this.execute(
      `SELECT user_id, resource, details FROM audit_log WHERE action = 'user.register' AND user_id IS NOT NULL`,
    )) as AuditRow[];
    if (registrations.length === 0) return;

    const registeredWith = new Map<number, string[]>();
    for (const row of registrations) {
      const email = detailsOf(row)?.email;
      if (typeof email !== 'string' || row.user_id === null) continue;
      registeredWith.set(row.user_id, [...(registeredWith.get(row.user_id) ?? []), email.trim().toLowerCase()]);
    }

    const adminEdits = (await this.execute(
      `SELECT user_id, resource, details FROM audit_log WHERE action = 'admin.user_update'`,
    )) as AuditRow[];
    const editedByAdmin = new Set<string>();
    for (const row of adminEdits) {
      const fields = detailsOf(row)?.fields;
      if (row.resource && Array.isArray(fields) && fields.includes('email')) editedByAdmin.add(row.resource);
    }

    const users = (await this.execute(`SELECT id, email FROM users WHERE COALESCE(is_guest, 0) = 0`)) as UserEmailRow[];
    for (const user of users) {
      const registered = registeredWith.get(user.id);
      if (!registered || editedByAdmin.has(String(user.id))) continue;
      if (registered.includes(user.email.trim().toLowerCase())) continue;
      await this.execute('UPDATE users SET email_self_asserted = 1 WHERE id = ?', [user.id]);
    }
  }
}
