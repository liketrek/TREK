/**
 * `Migration20200101046430_a_paused_mail_import_can_tell_its_address_holders`:
 * `mail_ingest_cursor` is rebuilt so the pause notice job can keep its row
 * (`transport = 'notice'`), without losing a reader's position or lease; an
 * unknown transport is still refused and a reader stays unique per mailbox.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046430_a_paused_mail_import_can_tell_its_address_holders';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

describe('Mail ingest cursor notice migration', () => {
  it('MICURMIG-001: keeps every reader as it was and lets the notice job take its row', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        `INSERT INTO mail_ingest_cursor
           (id, transport, mailbox, uid_validity, last_uid, last_ok_at, last_error, lease_owner, lease_until)
         VALUES (4, 'imap', 'INBOX', 7, 42, '2026-11-01 10:00:00', 'timeout', 'a', '2026-11-01 10:05:00')`,
      );
      await expect(
        rawExec(orm, "INSERT INTO mail_ingest_cursor (transport, mailbox) VALUES ('notice', 'paused')"),
      ).rejects.toThrow(/CHECK/);

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT * FROM mail_ingest_cursor')).toEqual([
        {
          id: 4,
          transport: 'imap',
          mailbox: 'INBOX',
          uid_validity: 7,
          last_uid: 42,
          last_ok_at: '2026-11-01 10:00:00',
          last_error: 'timeout',
          lease_owner: 'a',
          lease_until: '2026-11-01 10:05:00',
        },
      ]);
      await rawExec(orm, "INSERT INTO mail_ingest_cursor (transport, mailbox) VALUES ('notice', 'paused')");
      await expect(
        rawExec(orm, "INSERT INTO mail_ingest_cursor (transport, mailbox) VALUES ('notice', 'paused')"),
      ).rejects.toThrow(/UNIQUE/);
      await expect(
        rawExec(orm, "INSERT INTO mail_ingest_cursor (transport, mailbox) VALUES ('webhook', '')"),
      ).rejects.toThrow(/CHECK/);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
