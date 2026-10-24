import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 114 (`db/migrations.ts`).
 *
 * Migration: RFC 8707 resource indicators — audience-bind OAuth tokens to /mcp
 */
export class Migration20200101015400_rfc_8707_resource_indicators extends Migration {
  override name = 'Migration20200101015400_rfc_8707_resource_indicators';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'oauth_tokens', 'audience', `audience TEXT`);
  }
}
