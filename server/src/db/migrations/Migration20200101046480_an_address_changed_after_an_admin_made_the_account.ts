import { Migration } from '@mikro-orm/migrations';

interface AuditRow {
  action: string;
  user_id: number | string | null;
  resource: string | null;
  details: string | null;
}

interface UserEmailRow {
  id: number | string;
  email: string;
}

interface AuditDetails {
  email?: unknown;
  fields?: unknown;
}

function readDetails(details: string | null): AuditDetails {
  if (!details) return {};
  try {
    const value: unknown = JSON.parse(details);
    return value && typeof value === 'object' ? (value as AuditDetails) : {};
  } catch {
    return {};
  }
}

/**
 * Marks the address of an account an admin created as the account's own once
 * it moved away from the one the admin entered.
 *
 * `Migration20200101042800_an_email_the_account_typed_in_itself` set
 * `email_self_asserted` for an account whose address moved away from the one
 * it registered with, comparing against its `user.register` audit row. An
 * account made in Admin > Users has no such row, only the admin's
 * `admin.user_create` (the new account's id in `resource`, the address in its
 * details), so it kept 0 even when the account itself had changed its address
 * in its settings before the upgrade. An SSO sign-in that asserts that address
 * then still linked into the account, which is what the flag exists to stop.
 *
 * This applies the same rule with the address the admin entered as the
 * baseline: an account an admin created, whose address is none of the ones it
 * was created or registered with, and whose email no admin ever edited (an
 * `admin.user_update` row naming `email`), only changed it itself. Since 5.0.0
 * a change in the settings sets the flag directly and an admin's change clears
 * it with such a row, so an account the rule marks now is one the first
 * migration missed. Only accounts still at 0 are touched, and nothing is ever
 * cleared.
 *
 * An account with no creation row at all (made before the audit log existed,
 * or whose rows were pruned) stays as it is: nothing tells what its address was.
 */
export class Migration20200101046480_an_address_changed_after_an_admin_made_the_account extends Migration {
  override name = 'Migration20200101046480_an_address_changed_after_an_admin_made_the_account';

  override async up(): Promise<void> {
    const rows = (await this.execute(
      `SELECT action, user_id, resource, details FROM audit_log
        WHERE action IN ('user.register', 'admin.user_create', 'admin.user_update')`,
    )) as AuditRow[];

    const createdByAdmin = new Set<string>();
    const editedByAdmin = new Set<string>();
    const baselines = new Map<string, string[]>();
    for (const row of rows) {
      const details = readDetails(row.details);
      if (row.action === 'admin.user_update') {
        if (row.resource && Array.isArray(details.fields) && details.fields.includes('email')) {
          editedByAdmin.add(row.resource);
        }
        continue;
      }
      // A registration names the account in user_id, an admin's creation in resource.
      const owner = row.action === 'user.register' ? row.user_id : row.resource;
      if (owner === null || typeof details.email !== 'string') continue;
      const id = String(owner);
      if (row.action === 'admin.user_create') createdByAdmin.add(id);
      baselines.set(id, [...(baselines.get(id) ?? []), details.email.trim().toLowerCase()]);
    }
    if (createdByAdmin.size === 0) return;

    const users = (await this.execute(
      `SELECT id, email FROM users WHERE COALESCE(is_guest, 0) = 0 AND email_self_asserted = 0`,
    )) as UserEmailRow[];
    // Queued, run after up() returns; the id comes from the database and is
    // checked to be an integer, nothing a user typed.
    for (const user of users) {
      const id = String(user.id);
      if (!createdByAdmin.has(id) || editedByAdmin.has(id)) continue;
      if (baselines.get(id)?.includes(user.email.trim().toLowerCase())) continue;
      const rowId = Number(user.id);
      if (!Number.isInteger(rowId)) continue;
      this.addSql(`UPDATE users SET email_self_asserted = 1 WHERE id = ${rowId}`);
    }
  }
}
