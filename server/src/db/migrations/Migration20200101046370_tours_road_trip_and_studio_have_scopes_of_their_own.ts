import { Migration } from '@mikro-orm/migrations';

/**
 * Tours, road trip and the journey's Studio get MCP scopes of their own
 * (`tours:*`, `roadtrip:*`, `studio:*`). Their tools used to be granted by
 * `trips:*` (tours, road trip), `places:*` (the road trip's route import) and
 * `journey:*` (the Studio), so every grant already stored is extended with the
 * scopes split off what it holds, mode for mode: an OAuth client keeps the
 * tools it was allowed, a remembered consent stays sufficient, and a live
 * token keeps working until it expires.
 *
 * The map is a frozen copy of IMPLIED_SCOPE_GROUPS in @trek/shared as it stood
 * when the groups were introduced; a migration must keep doing what it did
 * after that map is retired. Updated by stored value, so the statement is the
 * same on SQLite and Postgres; a value that is not a JSON list of strings is
 * left as it is.
 */
const SPLIT_OFF: Readonly<Record<string, readonly string[]>> = {
  trips: ['tours', 'roadtrip'],
  places: ['roadtrip'],
  journey: ['studio'],
};

const SPLIT_MODES = new Set(['read', 'write']);

const STORED_GRANTS: ReadonlyArray<{ table: string; column: string }> = [
  { table: 'oauth_clients', column: 'allowed_scopes' },
  { table: 'oauth_consents', column: 'scopes' },
  { table: 'oauth_tokens', column: 'scopes' },
];

export class Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own extends Migration {
  override name = 'Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own';

  /** The stored list with the split-off scopes added, or null when nothing changes or it is not a list. */
  static extendedGrant(stored: string): string | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed) || !parsed.every((s): s is string => typeof s === 'string')) return null;
    const extended = [...parsed];
    for (const scope of parsed) {
      const [group, mode] = scope.split(':');
      if (!SPLIT_MODES.has(mode)) continue;
      for (const target of SPLIT_OFF[group] ?? []) {
        const added = `${target}:${mode}`;
        if (!extended.includes(added)) extended.push(added);
      }
    }
    return extended.length === parsed.length ? null : JSON.stringify(extended);
  }

  override async up(): Promise<void> {
    const extend = Migration20200101046370_tours_road_trip_and_studio_have_scopes_of_their_own.extendedGrant;
    const perTable = await Promise.all(
      STORED_GRANTS.map(async ({ table, column }) => {
        const rows = (await this.execute(`SELECT DISTINCT ${column} AS grant_value FROM ${table}`)) as Array<{
          grant_value: string | null;
        }>;
        return rows.flatMap(({ grant_value: stored }) => {
          const extended = stored === null ? null : extend(stored);
          return extended === null ? [] : [{ table, column, stored, extended }];
        });
      }),
    );
    await Promise.all(
      perTable
        .flat()
        .map(({ table, column, stored, extended }) =>
          this.execute(`UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`, [extended, stored]),
        ),
    );
  }
}
