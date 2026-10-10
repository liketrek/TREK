/**
 * B1 / N1 (Plan 4 final review and its re-review): an install the retired
 * positional runner migrated to schema_version 66 (5be2e9b26) boots on this
 * release. It predates the ~30 tables that only `createTables()` ever made
 * (photo_providers, photo_provider_fields, …), so the baseline migration must
 * RUN on it, as the legacy boot did, not be recorded as executed.
 * The assertions live in tests/helpers/legacy-upgrade-suite.ts.
 */
import { db as legacyDb } from '../../src/db/database';
import { describeLegacyUpgrade } from '../helpers/legacy-upgrade-suite';

import { vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { buildDbMock } = await import('../helpers/db-mock');
  const { openLegacyFixture } = await import('../helpers/legacy-fixture');
  return buildDbMock(openLegacyFixture('legacy-v066'));
});
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

describeLegacyUpgrade(
  {
    fixture: 'legacy-v066',
    version: 66,
    reseated: 1,
    nightOrderIndex: 1,
    id: 'LEGACYUP-066',
    // Carried from the legacy chain itself, not caused by the upgrade: an install
    // this old got `users` and `reservations` from its own createTables(), and no
    // numbered step ever adds `users.immich_access_token` or retypes
    // `reservations.accommodation_id` (INTEGER there, TEXT in the baseline). The
    // legacy runner at 417d0445b would have left the same two differences.
    carriedSchemaDiffs: {
      onlyUpgraded: ['reservations.accommodation_id INTEGER notnull=0 default= pk=0'],
      onlyFresh: [
        'reservations.accommodation_id TEXT notnull=0 default= pk=0',
        'users.immich_access_token TEXT notnull=0 default= pk=0',
      ],
    },
  },
  legacyDb,
);
