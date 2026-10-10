/**
 * Storing TREK Studio books (#1973).
 *
 * The half worth testing hard is concurrency. Every editor on a journey edits
 * the same book, so "two saves arrive together" is the ordinary case rather
 * than an edge one, and the failure mode of getting it wrong is somebody's
 * afternoon disappearing with no error anywhere.
 */
import { db as testDb } from '../../../src/db/database';
import { db as dbConn } from '../../../src/db/database';
import { JourneyBooks } from '../../../src/db/entities/JourneyBooks.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyBookService } from '../../../src/nest/journey/journey-book.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser, createJourney, addJourneyContributor } from '../../helpers/factories';
import { countRows, deleteRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import {
  createTestJourneysRepo,
  createTestJourneyContributorsRepo,
  createTestJourneyTripsRepo,
  createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo,
  createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestJourneyBooksRepo } from '../../helpers/journey-share-repos';
import { resetTestDb } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm, createTestTripsRepo, createTestPlacesRepo } from '../../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});

let domain: JourneyDomainService;
let books: JourneyBookService;

/** A minimal document that survives normalizeBookDocument unchanged. */
function doc(title = 'one') {
  return {
    version: 1,
    title,
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 8 },
    spreads: [{ id: 's1', kind: 'inner', background: null, elements: [], parked: [] }],
  };
}

beforeAll(async () => {
  const uow = await createTestUnitOfWork(testDb);
  const t = await sharedTestOrm(testDb);
  domain = new JourneyDomainService(
    new RealtimeService(),
    new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)),
    uow,
    await createTestJourneysRepo(testDb),
    await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb),
    await createTestJourneyEntriesRepo(testDb),
    await createTestTripsRepo(testDb),
    // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
    await createTestJourneyPhotosRepo(testDb),
    await createTestJourneyEntryPhotosRepo(testDb),
    await createTestPlacesRepo(testDb),
  );
  // Plan 3g Task 3: JourneyBooksRepository (JB1-JB7), not `dbs` any more.
  // task-5-fix-brief constructor-ripple (M1): `UnitOfWork`, so `saveBook`'s
  // read-then-insert can be wrapped in one transaction.
  books = new JourneyBookService(domain, await createTestJourneyBooksRepo(testDb), uow);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// -- Access -------------------------------------------------------------------

describe('access', () => {
  it('refuses a journey the user cannot see', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(await books.getBook(journey.id, stranger.id)).toBeNull();
    expect(await books.saveBook(journey.id, stranger.id, { title: '', document: doc() })).toBeNull();
    expect(await books.deleteBook(journey.id, stranger.id)).toBeNull();
    expect(await books.canOpen(journey.id, stranger.id)).toBe(false);
  });

  /*
   * A book inherits its journey's access exactly. A second permission model
   * over the same object is how two rules end up disagreeing about who may do
   * what.
   */
  it('lets a contributor edit, not only the owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, helper.id, 'editor');

    const saved = await books.saveBook(journey.id, helper.id, { title: 'B', document: doc() });
    expect(saved && 'record' in saved).toBe(true);
    expect(await books.getBook(journey.id, helper.id)).not.toBeNull();
  });

  it('lets a viewer read the book but not overwrite or delete it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, guest.id, 'viewer');
    await books.saveBook(journey.id, owner.id, { title: 'Iceland', document: doc() });

    expect(await books.canOpen(journey.id, guest.id)).toBe(true);
    expect(await books.getBook(journey.id, guest.id)).not.toBeNull();
    expect(await books.saveBook(journey.id, guest.id, { title: 'mine now', document: doc('two') })).toBeNull();
    expect(await books.deleteBook(journey.id, guest.id)).toBeNull();
    expect((await books.getBook(journey.id, owner.id))!.title).toBe('Iceland');
  });

  it('says nothing about a journey that does not exist', async () => {
    const { user } = createUser(testDb);
    expect(await books.canOpen(999_999, user.id)).toBe(false);
    expect(await books.getBook(999_999, user.id)).toBeNull();
  });
});

// -- Creating and reading -----------------------------------------------------

describe('creating and reading', () => {
  it('is null for a journey with no book yet', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    expect(await books.getBook(journey.id, user.id)).toBeNull();
    expect(await books.canOpen(journey.id, user.id)).toBe(true);
  });

  it('creates on first save, at version 1', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const saved = await books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc() });
    expect(saved && 'record' in saved && saved.record.version).toBe(1);
    expect(saved && 'record' in saved && saved.record.title).toBe('Iceland');
  });

  it('reads the document back as it went in', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    const read = (await books.getBook(journey.id, user.id))!;
    expect(read.document.spreads).toHaveLength(1);
    expect(read.document.page.pageWidth).toBe(210);
  });

  it('records who saved it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc() });
    expect((await books.getBook(journey.id, user.id))!.updatedBy).toBe(user.id);
  });

  it('lists books without their documents', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc() });

    const list = (await books.listBooks(journey.id, user.id))!;
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Iceland');
    expect('document' in list[0]).toBe(false);
  });

  /*
   * A document that will not parse still has to open. One drifted field should
   * not lock somebody out of their own book — normalizeBookDocument drops what
   * it cannot read rather than throwing.
   */
  it('opens a book whose stored JSON is broken, rather than throwing', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await insertRow(await sharedTestOrm(testDb), JourneyBooks, {
      journey: journey.id,
      title: 'T',
      document: '{not json',
      version: 1,
    });

    const read = await books.getBook(journey.id, user.id);
    expect(read).not.toBeNull();
    expect(read!.document.spreads).toEqual([]);
  });
});

// -- Concurrency --------------------------------------------------------------

describe('concurrency', () => {
  async function seed() {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    return { user, journey };
  }

  it('bumps the version on every save', async () => {
    const { user, journey } = await seed();
    const second = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('two'),
      baseVersion: 1,
    });
    expect(second && 'record' in second && second.record.version).toBe(2);
  });

  /* The one this column exists for. */
  it('refuses a save made against a version that has moved', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });

    const stale = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale).toBe(true);
  });

  it('answers a conflict with the current record, not only a refusal', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'Theirs', document: doc('two'), baseVersion: 1 });

    const stale = await books.saveBook(journey.id, user.id, {
      title: 'Mine',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale && stale.conflict.version).toBe(2);
    expect(stale && 'conflict' in stale && stale.conflict.title).toBe('Theirs');
    expect(stale && 'conflict' in stale && stale.conflict.document.title).toBe('two');
  });

  it('leaves the stored document untouched when it refuses', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'Theirs', document: doc('two'), baseVersion: 1 });
    await books.saveBook(journey.id, user.id, { title: 'Mine', document: doc('three'), baseVersion: 1 });

    expect((await books.getBook(journey.id, user.id))!.document.title).toBe('two');
    expect((await books.getBook(journey.id, user.id))!.version).toBe(2);
  });

  /*
   * "Open Studio and start editing" has to work for the second person to
   * arrive, who has a document but no version yet.
   */
  it('takes a save with no base version as an ordinary write', async () => {
    const { user, journey } = await seed();
    const saved = await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two') });
    expect(saved && 'record' in saved && saved.record.version).toBe(2);
  });

  it('lets the loser save again once it has the new version', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const conflict = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('mine'),
      baseVersion: 1,
    });
    expect(conflict && 'conflict' in conflict).toBe(true);

    const retry = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('mine'),
      baseVersion: 2,
    });
    expect(retry && 'record' in retry && retry.record.version).toBe(3);
    expect((await books.getBook(journey.id, user.id))!.document.title).toBe('mine');
  });

  it('does not let a version from another journey unlock this one', async () => {
    const { user, journey } = await seed();
    const other = createJourney(testDb, user.id);
    await books.saveBook(other.id, user.id, { title: 'O', document: doc('other') });

    // Version 1 is current over there and stale here.
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const stale = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale).toBe(true);
    expect((await books.getBook(other.id, user.id))!.version).toBe(1);
  });

  // JB5 (R2) — the brief's exact named tests: the one statement in the whole
  // plan whose control-flow contract ("convert the statement" AND "preserve
  // the exact branching") is the same instruction.
  it('journey-book-svc: concurrent save with a stale baseVersion returns {conflict}, does not throw', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });

    const stale = await books.saveBook(journey.id, user.id, { title: 'T', document: doc('three'), baseVersion: 1 });

    expect(stale).not.toBeNull();
    expect(stale && 'conflict' in stale).toBe(true);
  });

  it('journey-book-svc: the conflict payload is the freshly re-read record, not the stale one the caller sent', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'Theirs', document: doc('two'), baseVersion: 1 });

    const stale = await books.saveBook(journey.id, user.id, { title: 'Mine', document: doc('three'), baseVersion: 1 });

    expect(stale && 'conflict' in stale && stale.conflict.title).toBe('Theirs');
    expect(stale && 'conflict' in stale && stale.conflict.document.title).toBe('two');
    expect(stale && 'conflict' in stale && stale.conflict.version).toBe(2);
  });

  it('journey-book-svc: mutation proof — an UPDATE without the WHERE version guard would silently clobber a concurrent save', async () => {
    const { user, journey } = await seed();
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    // The real, version-guarded save correctly refuses the stale write:
    const stale = await books.saveBook(journey.id, user.id, { title: 'T', document: doc('three'), baseVersion: 1 });
    expect(stale && 'conflict' in stale).toBe(true);

    // The same write with the `AND version = ?` guard stripped — proving
    // that guard, not something else, is what makes the refusal above real.
    const orm = await sharedTestOrm(testDb);
    const row = await findRow(orm, JourneyBooks, { journey: journey.id });
    if (!row) throw new Error('the save above should have left a book');
    await updateRows(
      orm,
      JourneyBooks,
      { id: row.id },
      {
        title: 'Clobbered',
        document: JSON.stringify(doc('clobbered')),
        version: row.version + 1,
      },
    );
    const afterMutation = await findRow(orm, JourneyBooks, { id: row.id });
    expect(afterMutation?.title).toBe('Clobbered');
  });

  // M1 (task-5-review.md) — JB3's existing-link read and JB4's insert used
  // to be two separate awaits, so two concurrent FIRST saves of a journey
  // with no book yet could both read "no book" and both insert, leaving one
  // editor's save orphaned behind `getBook`'s `ORDER BY id LIMIT 1` (there is
  // no unique index on `journey_id`). Races two REAL `await Promise.all([...])`
  // callers through the actual service on the shared connection, then
  // asserts the base's outcome: exactly one row, and the loser lands on the
  // JB5 CAS-update path (version 2), not a second insert.
  it('journey-book-svc M1: two concurrent first saves of a journey with no book — exactly one row, ending at version 2', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const [a, b] = await Promise.all([
      books.saveBook(journey.id, user.id, { title: 'A', document: doc('a') }),
      books.saveBook(journey.id, user.id, { title: 'B', document: doc('b') }),
    ]);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // One of the two lands as the first insert (version 1, before the
    // second's own read observes it and takes the CAS-update branch); the
    // other either also lands as {record} (version 2, having taken the
    // update branch against baseVersion undefined -> existing.version) or
    // sees a stale conflict — either way, never a second inserted row.
    const orm = await sharedTestOrm(testDb);
    expect(await countRows(orm, JourneyBooks, { journey: journey.id })).toBe(1);

    const finalVersion = (await findRow(orm, JourneyBooks, { journey: journey.id }))?.version;
    expect(finalVersion).toBe(2);
  });
});

// -- Broadcasting -------------------------------------------------------------

describe('broadcastSaved', () => {
  it('sends the version, not the document, and excludes the saver', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const saved = (await books.saveBook(journey.id, user.id, { title: 'T', document: doc() }))!;
    const record = 'record' in saved ? saved.record : null;

    const spy = vi.spyOn(domain, 'broadcastJourneyEvent').mockImplementation(async () => {});
    await books.broadcastSaved(journey.id, user.id, record!, 'socket-7');

    expect(spy).toHaveBeenCalledWith(journey.id, 'journey:book:saved', { version: 1, savedBy: user.id }, 'socket-7');
    spy.mockRestore();
  });
});

// -- Deleting -----------------------------------------------------------------

describe('deleting', () => {
  it('removes the book and reports it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    expect(await books.deleteBook(journey.id, user.id)).toBe(true);
    expect(await books.getBook(journey.id, user.id)).toBeNull();
  });

  it('reports false when there was nothing to delete', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    expect(await books.deleteBook(journey.id, user.id)).toBe(false);
  });

  it('goes with the journey it belongs to', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    const orm = await sharedTestOrm(testDb);
    await deleteRows(orm, Journeys, { id: journey.id });

    expect(await countRows(orm, JourneyBooks, { journey: journey.id })).toBe(0);
  });
});
