import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 197 (`db/migrations.ts`).
 *
 * Give back the notes the TICKETJSON step chopped up (#1658).
 *
 * That step matched with LIKE, which is case-insensitive in SQLite, so a note
 * somebody had typed starting "ticketjson:" was read as a receipt: the first
 * eleven characters were dropped, the rest was moved into ticket_json and the
 * note was set to NULL. The step now matches with GLOB, but that only helps a
 * fresh install — the legacy array was index-addressed against schema_version,
 * so a repaired step never ran again on a database that had already applied it.
 *
 * A receipt comes out of JSON.stringify and always parses; typed text does not.
 * So a row moves back only when its ticket_json fails to parse AND the note is
 * still empty — anything that parses, and any row someone has written a note on
 * since, is left exactly as it is. The eleven marker characters themselves are
 * gone for good: their case was the only thing separating a receipt from a note,
 * and writing "TICKETJSON:" back would hand the row straight to the reader that
 * reads that prefix as a receipt.
 */
export class Migration20200101031700_give_back_the_notes_the_ticketjson_step extends Migration {
  override name = 'Migration20200101031700_give_back_the_notes_the_ticketjson_step';

  override async up(): Promise<void> {
    const rows = (await this.execute(
      `SELECT id, ticket_json FROM budget_items
        WHERE ticket_json IS NOT NULL AND ticket_json != '' AND COALESCE(note, '') = ''`,
    )) as { id: number; ticket_json: string }[];

    for (const row of rows) {
      try {
        JSON.parse(row.ticket_json);
      } catch {
        await this.execute(`UPDATE budget_items SET note = ?, ticket_json = NULL WHERE id = ?`, [
          row.ticket_json,
          row.id,
        ]);
      }
    }
  }
}
