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
  targetUser?: unknown;
  fields?: unknown;
}

/** One admin save of an account: the address it found, and whether it sent an email at all. */
interface AdminSave {
  found: string | null;
  sentEmail: boolean;
}

interface History {
  /** The addresses the account was created or registered with; null once one of them is unreadable. */
  baselines: string[] | null;
  /** The admin saves since its creation, oldest first. */
  saves: AdminSave[];
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

const normalize = (email: string) => email.trim().toLowerCase();

/**
 * Marks an address an account set itself even when an admin saved the account
 * afterwards.
 *
 * `Migration20200101042800_an_email_the_account_typed_in_itself` and
 * `Migration20200101046480_an_address_changed_after_an_admin_made_the_account`
 * set `email_self_asserted` for an account whose address moved away from the one
 * it was registered or created with, unless an `admin.user_update` row names
 * `email`. But the edit dialog sends the email on every save, so every admin save
 * names it, a role change too, and one save of the account at any time kept the
 * flag at 0, even long after the account had moved its own address.
 *
 * Each such row also holds the address the account had when the admin saved it
 * (`targetUser`). So the history answers who set the current address: if every
 * admin save already found it, it was set before the first save, and between the
 * creation and that save only the account itself could change it. If the last
 * save that found another address sent no email, the address moved after that
 * save, again by the account itself. Either way the account is marked.
 *
 * When that last save did send an email, the admin may have typed the current
 * address in, and the rows cannot tell: the admin's new address is not logged,
 * and neither is a change the account made in its settings before 5.0.0. Such an
 * account stays as it is, the same as every account at its registered address and
 * every account with no creation row: marking it would refuse the first SSO
 * sign-in of an address an admin vouched for. Since 5.0.0 a change in the
 * settings sets the flag directly and an admin's new address clears it, so an
 * account this can still mark is one whose address moved before that.
 *
 * A creation row starts the account's history anew, so the saves of an account
 * that once held the same id do not count. An unreadable creation row or save
 * leaves the account as it is. Only accounts still at 0 are touched, and nothing
 * is ever cleared.
 */
export class Migration20200101046500_an_address_moved_before_an_admin_saved_the_account extends Migration {
  override name = 'Migration20200101046500_an_address_moved_before_an_admin_saved_the_account';

  override async up(): Promise<void> {
    const rows = (await this.execute(
      `SELECT action, user_id, resource, details FROM audit_log
        WHERE action IN ('user.register', 'admin.user_create', 'admin.user_update')
        ORDER BY id`,
    )) as AuditRow[];

    const histories = new Map<string, History>();
    for (const row of rows) {
      const details = readDetails(row.details);
      if (row.action === 'admin.user_update') {
        const history = row.resource ? histories.get(row.resource) : undefined;
        if (!history) continue;
        const found = typeof details.targetUser === 'string' ? normalize(details.targetUser) : null;
        const sentEmail = !Array.isArray(details.fields) || details.fields.includes('email');
        history.saves.push({ found, sentEmail });
        continue;
      }
      // A registration names the account in user_id, an admin's creation in resource.
      const owner = row.action === 'user.register' ? row.user_id : row.resource;
      if (owner === null) continue;
      const id = String(owner);
      const before = histories.get(id)?.baselines;
      const baselines =
        typeof details.email === 'string' && before !== null ? [...(before ?? []), normalize(details.email)] : null;
      histories.set(id, { baselines, saves: [] });
    }
    if (histories.size === 0) return;

    const users = (await this.execute(
      `SELECT id, email FROM users WHERE COALESCE(is_guest, 0) = 0 AND email_self_asserted = 0`,
    )) as UserEmailRow[];
    // Queued, run after up() returns; the id comes from the database and is
    // checked to be an integer, nothing a user typed.
    for (const user of users) {
      const history = histories.get(String(user.id));
      if (!history?.baselines) continue;
      const current = normalize(user.email);
      if (history.baselines.includes(current)) continue;
      const lastOther = [...history.saves].reverse().find((save) => save.found !== current);
      if (lastOther && (lastOther.found === null || lastOther.sentEmail)) continue;
      const rowId = Number(user.id);
      if (!Number.isInteger(rowId)) continue;
      this.addSql(`UPDATE users SET email_self_asserted = 1 WHERE id = ${rowId}`);
    }
  }
}
