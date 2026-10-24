import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 226 (`db/migrations.ts`).
 *
 * Per-key read scopes for /api/v1 (#2279). The `include` parameter picks which
 * sections a *response* carries; it has never restricted what a key may read,
 * and handing an integration a key that reads every trip because it wanted day
 * notes is the thing that needed fixing.
 *
 * `scope_mode` is an explicit flag rather than "NULL means everything": a
 * sentinel here would mean a bug that drops the scopes column silently grants
 * full access. Every existing key is 'all', so nothing that works today stops
 * working — the restriction is opt-in at mint time.
 */
export class Migration20200101034600_per_key_read_scopes_for_api_v1 extends Migration {
  override name = 'Migration20200101034600_per_key_read_scopes_for_api_v1';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'mcp_tokens', 'scope_mode', `scope_mode TEXT NOT NULL DEFAULT 'all'`);
    await addColumnIfMissing(this, 'mcp_tokens', 'api_scopes', `api_scopes TEXT`);
  }
}
