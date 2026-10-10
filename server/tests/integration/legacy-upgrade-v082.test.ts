/**
 * B1 (Plan 4 final review): an install the retired positional runner migrated
 * to schema_version 82 boots on this release — tag v2.9.14, so seven of the eight migrations that are not replay-safe (steps 90–127) still lie ahead of it and must run for the first time rather than be skipped.
 * The assertions live in tests/helpers/legacy-upgrade-suite.ts.
 */
import { db as legacyDb } from '../../src/db/database';
import { describeLegacyUpgrade } from '../helpers/legacy-upgrade-suite';

import { vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { buildDbMock } = await import('../helpers/db-mock');
  const { openLegacyFixture } = await import('../helpers/legacy-fixture');
  return buildDbMock(openLegacyFixture('legacy-v082'));
});

describeLegacyUpgrade(
  { fixture: 'legacy-v082', version: 82, reseated: 1, nightOrderIndex: 1, id: 'LEGACYUP-082' },
  legacyDb,
);
