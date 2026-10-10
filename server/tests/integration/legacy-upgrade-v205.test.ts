/**
 * B1 (Plan 4 final review): an install the retired positional runner migrated
 * to schema_version 205 boots on this release — the released chain (main), so steps 206–242 run on it, including the booked-night reseat.
 * The assertions live in tests/helpers/legacy-upgrade-suite.ts.
 */
import { db as legacyDb } from '../../src/db/database';
import { describeLegacyUpgrade } from '../helpers/legacy-upgrade-suite';

import { vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { buildDbMock } = await import('../helpers/db-mock');
  const { openLegacyFixture } = await import('../helpers/legacy-fixture');
  return buildDbMock(openLegacyFixture('legacy-v205'));
});
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

describeLegacyUpgrade(
  { fixture: 'legacy-v205', version: 205, reseated: 1, nightOrderIndex: 1, id: 'LEGACYUP-205' },
  legacyDb,
);
