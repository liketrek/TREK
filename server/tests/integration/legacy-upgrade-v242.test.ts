/**
 * B1 (Plan 4 final review): an install the retired positional runner migrated
 * to schema_version 242 boots on this release — the runner's last step, so only the post-legacy migrations run. Its booked night was left deliberately out of its seat: if the reseat (step 242) were replayed it would move.
 * The assertions live in tests/helpers/legacy-upgrade-suite.ts.
 */
import { db as legacyDb } from '../../src/db/database';
import { describeLegacyUpgrade } from '../helpers/legacy-upgrade-suite';

import { vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { buildDbMock } = await import('../helpers/db-mock');
  const { openLegacyFixture } = await import('../helpers/legacy-fixture');
  return buildDbMock(openLegacyFixture('legacy-v242'));
});

describeLegacyUpgrade(
  { fixture: 'legacy-v242', version: 242, reseated: 0, nightOrderIndex: 3, id: 'LEGACYUP-242' },
  legacyDb,
);
