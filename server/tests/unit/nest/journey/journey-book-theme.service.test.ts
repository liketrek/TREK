/**
 * `set_book_theme` through JourneyBookEditService (JBTHM-*): a theme applied
 * to the whole book or to some pages, the book as it was kept as a revision
 * its undo restores, an apply that changes nothing written nowhere, and the
 * refusals a viewer and a bad request get. Taken from JourneyBookDesignModule
 * over a snapshot test db, with the realtime fake.
 */
import { JourneyBookRevisions } from '../../../../src/db/entities/JourneyBookRevisions.entity';
import { catchDomainError, DomainError } from '../../../../src/nest/common/domain-error';
import { JourneyBookDesignModule } from '../../../../src/nest/journey/journey-book-design.module';
import { JourneyBookDesignService } from '../../../../src/nest/journey/journey-book-design.service';
import { JourneyBookEditService } from '../../../../src/nest/journey/journey-book-edit.service';
import { JourneyBookService } from '../../../../src/nest/journey/journey-book.service';
import { PhotoResolverService } from '../../../../src/nest/memories/photo-resolver.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../../helpers/factories/journeys';
import { findRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { bookThemeOf, bookWriteResultSchema } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let edit: JourneyBookEditService;
let designs: JourneyBookDesignService;
let books: JourneyBookService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyBookDesignModule],
    overrides: [{ provide: PhotoResolverService, useValue: { readForSignals: async () => ({ kind: 'none' }) } }],
  });
  edit = t.get(JourneyBookEditService);
  designs = t.get(JourneyBookDesignService);
  books = t.get(JourneyBookService);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  t.realtime.reset();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

/** A journey with its owner and a viewer, and a blank book. */
async function crew() {
  const { user: owner } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Lisbon' });
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  const created = await edit.createBook(journey.id, owner.id, {});
  const inner = created.pages.find((p) => p.role === 'inner')?.id ?? 'no inner page';
  t.realtime.reset();
  return { owner, viewer, journey, created, inner };
}

async function refusal(pending: () => Promise<unknown>) {
  const err = await catchDomainError(pending);
  if (!(err instanceof DomainError)) throw new Error('the call was not refused');
  return { status: err.getStatus(), code: err.code };
}

const stored = async (journeyId: number, userId: number) => (await books.getBook(journeyId, userId))?.document;

describe('set_book_theme', () => {
  it('JBTHM-001: applies a theme to every page, keeps the book as it was as a revision, and answers its id', async () => {
    const { journey, owner, created } = await crew();

    const done = await edit.setTheme(journey.id, owner.id, { theme: 'alpine' });

    expect(bookWriteResultSchema.safeParse(done).success).toBe(true);
    expect(done.version).toBe(created.version + 1);
    expect(done.spread_ids).toHaveLength(created.pages.length);
    const revisionId = done.revision_id ?? 0;
    expect(revisionId).toBeGreaterThan(0);
    expect(await findRow(orm, JourneyBookRevisions, { id: revisionId })).toBeTruthy();
    const doc = await stored(journey.id, owner.id);
    expect(doc?.theme?.id).toBe('alpine');
    expect(doc?.spreads.every((s) => s.background === bookThemeOf('alpine').palette.paper)).toBe(true);
  });

  it('JBTHM-002: is taken back by restoring that revision', async () => {
    const { journey, owner } = await crew();
    const done = await edit.setTheme(journey.id, owner.id, { theme: 'cutout' });

    await designs.restoreRevision(journey.id, owner.id, {
      revisionId: done.revision_id ?? 0,
      expectedVersion: done.version,
    });

    const doc = await stored(journey.id, owner.id);
    expect(doc?.theme).toBeUndefined();
    expect(doc?.spreads.every((s) => s.background === null)).toBe(true);
  });

  it('JBTHM-003: recolours only the pages named, and writes nothing when nothing would change', async () => {
    const { journey, owner, inner } = await crew();
    const one = await edit.setTheme(journey.id, owner.id, { theme: 'nordic', spreadIds: [inner] });
    expect(one.spread_ids).toEqual([inner]);
    t.realtime.reset();

    const again = await edit.setTheme(journey.id, owner.id, { theme: 'nordic', spreadIds: [inner] });

    expect(again.version).toBe(one.version);
    expect(t.realtime.broadcastToUserMock.mock.calls).toHaveLength(0);
  });

  it('JBTHM-004: refuses a viewer, a page the book does not have and a face this build does not set', async () => {
    const { journey, owner, viewer } = await crew();
    expect(await refusal(() => edit.setTheme(journey.id, viewer.id, { theme: 'alpine' }))).toMatchObject({
      status: 403,
    });
    const gone = await refusal(() => edit.setTheme(journey.id, owner.id, { theme: 'alpine', spreadIds: ['sp-none'] }));
    expect(gone.status).toBeGreaterThanOrEqual(400);
    const font = await refusal(() =>
      edit.setTheme(journey.id, owner.id, { theme: 'alpine', fonts: { body: { font: 'comic' } } }),
    );
    expect(font.status).toBeGreaterThanOrEqual(400);
    // Nothing of it reached the book.
    expect((await stored(journey.id, owner.id))?.theme).toBeUndefined();
  });

  it('JBTHM-005: refuses a theme for a journey without a book', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id, { title: 'Porto' });
    const none = await refusal(() => edit.setTheme(journey.id, owner.id, { theme: 'alpine' }));
    expect(none.status).toBeGreaterThanOrEqual(400);
  });
});
