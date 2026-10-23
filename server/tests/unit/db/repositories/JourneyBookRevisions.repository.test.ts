/**
 * `JourneyBookRevisionsRepository` (JBREV-*): a revision is the book as it
 * stood at a version, read back only for its own journey; pruning keeps a
 * journey's newest revisions and leaves another journey's alone; a revision
 * goes with its journey.
 */
import { JourneyBookRevisions } from '../../../../src/db/entities/JourneyBookRevisions.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import type { JourneyBookRevisionsRepository } from '../../../../src/db/repositories/JourneyBookRevisions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeJourney } from '../../../helpers/factories/journeys';
import { countRows, deleteRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let revisions: JourneyBookRevisionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  revisions = t.repo(JourneyBookRevisions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('JourneyBookRevisionsRepository', () => {
  it('JBREV-001: a revision reads back as kept, for its own journey only', async () => {
    const { user } = await makeUser(t);
    const journey = await makeJourney(t, user.id);
    const other = await makeJourney(t, user.id);

    const id = await revisions.insertRevision(journey.id, 4, '{"title":"Lisbon"}');

    const kept = await revisions.findForJourney(id, journey.id);
    expect(kept).toMatchObject({ id, journey_id: journey.id, version: 4, document: '{"title":"Lisbon"}' });
    expect(kept?.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(await revisions.findForJourney(id, other.id)).toBeUndefined();
    expect(await revisions.findForJourney(id + 100, journey.id)).toBeUndefined();
  });

  it("JBREV-002: pruning keeps the journey's newest revisions and leaves another journey's alone", async () => {
    const { user } = await makeUser(t);
    const journey = await makeJourney(t, user.id);
    const other = await makeJourney(t, user.id);
    // One after another, so the ids follow the versions.
    const ids = await [1, 2, 3, 4, 5, 6, 7].reduce<Promise<number[]>>(
      async (kept, version) => [...(await kept), await revisions.insertRevision(journey.id, version, '{}')],
      Promise.resolve([]),
    );
    const elsewhere = await revisions.insertRevision(other.id, 1, '{}');

    expect(await revisions.pruneRevisions(journey.id, 5)).toBe(2);

    expect(await revisions.findForJourney(ids[0] ?? 0, journey.id)).toBeUndefined();
    expect(await revisions.findForJourney(ids[1] ?? 0, journey.id)).toBeUndefined();
    expect((await revisions.findForJourney(ids[2] ?? 0, journey.id))?.version).toBe(3);
    expect(await revisions.findForJourney(elsewhere, other.id)).toBeDefined();
    expect(await revisions.pruneRevisions(journey.id, 5)).toBe(0);
  });

  it('JBREV-003: a revision goes with its journey', async () => {
    const { user } = await makeUser(t);
    const journey = await makeJourney(t, user.id);
    await revisions.insertRevision(journey.id, 1, '{}');
    await deleteRows(t, Journeys, { id: journey.id });
    expect(await countRows(t, JourneyBookRevisions)).toBe(0);
  });
});
