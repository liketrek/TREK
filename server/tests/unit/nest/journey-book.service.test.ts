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
import { JourneyBookRevisions } from '../../../src/db/entities/JourneyBookRevisions.entity';
import { JourneyBooks } from '../../../src/db/entities/JourneyBooks.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
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
import { normalizeBookDocument } from '@trek/shared';

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
  // WP13: the revisions a whole-book design keeps, in editBook's transaction.
  const revisions = (await sharedTestOrm(testDb)).repo(JourneyBookRevisions);
  books = new JourneyBookService(domain, await createTestJourneyBooksRepo(testDb), uow, revisions);
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

/**
 * Who heard what, recorded off the domain's fan-out: the event, its payload,
 * the socket left out, and whether a transaction was still open at the time.
 */
async function recordSends() {
  const em = (await sharedTestOrm(testDb)).em;
  const sent: Array<{ event: string; data: Record<string, unknown>; skips: unknown; inTx: boolean }> = [];
  const spy = vi.spyOn(domain, 'broadcastJourneyEvent').mockImplementation(async (_journeyId, event, data, skips) => {
    sent.push({ event, data, skips, inTx: em.isInTransaction() });
  });
  return { sent, restore: () => spy.mockRestore() };
}

describe('saveBook announces', () => {
  it('JBOOK-001: a save that lands, after its commit, with the version and the saver, leaving out the saving tab', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const rec = await recordSends();
    try {
      await books.saveBook(journey.id, user.id, { title: 'T', document: doc() }, { socketId: 'socket-7' });
      expect(rec.sent).toEqual([
        { event: 'journey:book:saved', data: { version: 1, savedBy: user.id }, skips: 'socket-7', inTx: false },
      ]);
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-002: nothing for a conflict or a refused save, since nothing was written', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, guest.id, 'viewer');
    await books.saveBook(journey.id, owner.id, { title: 'T', document: doc('one') });
    await books.saveBook(journey.id, owner.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const rec = await recordSends();
    try {
      const stale = await books.saveBook(journey.id, owner.id, { title: 'T', document: doc('x'), baseVersion: 1 });
      expect(stale && 'conflict' in stale).toBe(true);
      expect(await books.saveBook(journey.id, guest.id, { title: 'T', document: doc('y') })).toBeNull();
      expect(rec.sent).toEqual([]);
    } finally {
      rec.restore();
    }
  });
});

// -- Editing (the book tools' write) ------------------------------------------

describe('editBook', () => {
  const edited = (title: string) => () => ({ title, document: normalizeBookDocument(doc(title)), result: title });

  it('JBOOK-003: creates the book a journey lacks, at version 1, and tells every tab, the asking one too', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const rec = await recordSends();
    try {
      const seen: Array<number | null> = [];
      const out = await books.editBook(journey.id, user.id, (current) => {
        seen.push(current?.version ?? null);
        return edited('first')();
      });
      expect(seen).toEqual([null]);
      expect(out.record.version).toBe(1);
      expect(out.result).toBe('first');
      expect(rec.sent).toEqual([
        { event: 'journey:book:saved', data: { version: 1, savedBy: user.id }, skips: undefined, inTx: false },
      ]);
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-004: edits what is stored now and bumps its version, the record coming back as GET reads it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc('one') });
    await books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc('two'), baseVersion: 1 });

    const out = await books.editBook(journey.id, user.id, (current) => ({
      title: current?.title ?? '',
      document: normalizeBookDocument({ ...doc('three'), spreads: current?.document.spreads ?? [] }),
      result: current?.document.title,
    }));

    expect(out.result).toBe('two');
    expect(out.record.version).toBe(3);
    expect(await books.getBook(journey.id, user.id)).toEqual(out.record);
    expect(out.record.title).toBe('Iceland');
    expect(out.record.document.title).toBe('three');
  });

  it('JBOOK-005: an edit that throws rolls back: nothing written, nobody told', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    const rec = await recordSends();
    try {
      const refusal = new DomainError(422, 'ops[0]: no element p-9');
      const thrown = await catchDomainError(() =>
        books.editBook(journey.id, user.id, () => {
          throw refusal;
        }),
      );
      expect(thrown).toBe(refusal);
      expect(rec.sent).toEqual([]);
      const stored = await books.getBook(journey.id, user.id);
      expect([stored?.version, stored?.document.title]).toEqual([1, 'one']);
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-006: refuses a moved book with 409 when a version is expected, writing and sending nothing', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const rec = await recordSends();
    try {
      const edit = vi.fn(edited('undo'));
      const thrown = await catchDomainError(() => books.editBook(journey.id, user.id, edit, { expectedVersion: 1 }));
      expect(thrown instanceof DomainError && [thrown.getStatus(), thrown.mcpMessage]).toEqual([
        409,
        'The book was changed since that version. Read it again with get_book before changing it.',
      ]);
      expect(edit).not.toHaveBeenCalled();
      expect(rec.sent).toEqual([]);
      expect((await books.getBook(journey.id, user.id))?.version).toBe(2);

      // At the version it names, the same write lands.
      const out = await books.editBook(journey.id, user.id, edited('undo'), { expectedVersion: 2 });
      expect(out.record.version).toBe(3);
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-007: a viewer is refused with 403 and someone outside the journey with 404, before any edit runs', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, guest.id, 'viewer');
    const edit = vi.fn(edited('nope'));

    const asGuest = await catchDomainError(() => books.editBook(journey.id, guest.id, edit));
    const asStranger = await catchDomainError(() => books.editBook(journey.id, stranger.id, edit));

    expect(asGuest instanceof DomainError && asGuest.getStatus()).toBe(403);
    expect(asStranger instanceof DomainError && [asStranger.getStatus(), asStranger.mcpMessage]).toEqual([
      404,
      'Journey not found or access denied.',
    ]);
    expect(edit).not.toHaveBeenCalled();
    expect(await books.getBook(journey.id, owner.id)).toBeNull();
  });

  it('JBOOK-008: against a Studio save at the same moment one wins and the other is told the book moved', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });

    const [tool, studio] = await Promise.all([
      catchDomainError(() => books.editBook(journey.id, user.id, edited('tool'), { expectedVersion: 1 })),
      books.saveBook(journey.id, user.id, { title: 'T', document: doc('studio'), baseVersion: 1 }),
    ]);

    const toolLost = tool instanceof DomainError && tool.getStatus() === 409;
    const studioLost = studio !== null && 'conflict' in studio;
    expect([toolLost, studioLost].filter(Boolean)).toHaveLength(1);
    const stored = await books.getBook(journey.id, user.id);
    expect(stored?.version).toBe(2);
    expect(stored?.document.title).toBe(toolLost ? 'studio' : 'tool');
  });

  it('JBOOK-009: an undo against a journey whose book is gone answers 409 with no current book, creating none', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const rec = await recordSends();
    try {
      const edit = vi.fn(edited('undo'));
      const thrown = await catchDomainError(() => books.editBook(journey.id, user.id, edit, { expectedVersion: 3 }));
      expect(thrown instanceof DomainError && [thrown.getStatus(), thrown.code, thrown.details]).toEqual([
        409,
        'book_conflict',
        { current: null },
      ]);
      expect(edit).not.toHaveBeenCalled();
      expect(rec.sent).toEqual([]);
      expect(await books.getBook(journey.id, user.id)).toBeNull();
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-010: an edit that says it changed nothing writes nothing, keeps the version and tells nobody', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    const rec = await recordSends();
    try {
      // The edit may read what it checks against before it answers.
      const out = await books.editBook(journey.id, user.id, async (current) => {
        await Promise.resolve();
        return { ...edited('ignored')(), unchanged: true, result: current?.version };
      });
      expect([out.result, out.record.version, out.record.document.title]).toEqual([1, 1, 'one']);
      expect(rec.sent).toEqual([]);
      expect((await books.getBook(journey.id, user.id))?.document.title).toBe('one');

      // Without a stored book there is nothing to leave alone: the book is made.
      const bare = createJourney(testDb, user.id);
      const made = await books.editBook(bare.id, user.id, () => ({ ...edited('new')(), unchanged: true }));
      expect(made.record.version).toBe(1);
      expect(rec.sent).toHaveLength(1);
    } finally {
      rec.restore();
    }
  });
});

// -- Format revisions ---------------------------------------------------------

/*
 * A book written by a newer revision of the format than the writer knows. The
 * older writer has already dropped what it could not read, so its save, from
 * an old tab or a replayed offline copy, must not land; nor may the book tools
 * of a server that cannot read the book whole.
 */
describe('format revisions', () => {
  /** A journey whose stored book says it was written by revision `schemaRev`. */
  async function storedAt(schemaRev: number) {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await insertRow(await sharedTestOrm(testDb), JourneyBooks, {
      journey: journey.id,
      title: 'T',
      document: JSON.stringify({ ...doc('newer'), schemaRev }),
      version: 1,
    });
    return { user, journey };
  }

  const refusalOf = (thrown: unknown) =>
    thrown instanceof DomainError ? [thrown.getStatus(), thrown.code, thrown.toBody().code] : thrown;

  it('JBOOK-011: refuses a save from a writer older than the stored book with 409 and the code, writing and sending nothing', async () => {
    const { user, journey } = await storedAt(2);
    const rec = await recordSends();
    try {
      const thrown = await catchDomainError(() =>
        books.saveBook(journey.id, user.id, { title: 'T', document: doc('older'), baseVersion: 1 }),
      );
      expect(refusalOf(thrown)).toEqual([409, 'book_schema_newer', 'book_schema_newer']);
      expect(thrown instanceof DomainError && thrown.toBody()).toMatchObject({
        error: 'Book was saved by a newer version of TREK Studio',
        schemaRev: 2,
      });
      expect(rec.sent).toEqual([]);
      const stored = await books.getBook(journey.id, user.id);
      expect([stored?.version, stored?.document.title, stored?.document.schemaRev]).toEqual([1, 'newer', 2]);
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-012: refuses a document newer than this server reads, first save and later save alike', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const ahead = { ...doc('ahead'), schemaRev: 9 };
    const first = await catchDomainError(() => books.saveBook(journey.id, user.id, { title: 'T', document: ahead }));
    expect(refusalOf(first)).toEqual([409, 'book_schema_newer', 'book_schema_newer']);
    expect(await books.getBook(journey.id, user.id)).toBeNull();

    await books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    const later = await catchDomainError(() =>
      books.saveBook(journey.id, user.id, { title: 'T', document: ahead, baseVersion: 1 }),
    );
    expect(refusalOf(later)).toEqual([409, 'book_schema_newer', 'book_schema_newer']);
    expect((await books.getBook(journey.id, user.id))?.document.title).toBe('one');
  });

  it('JBOOK-013: a save at the stored revision or above it lands as before, and a book of today stores no revision', async () => {
    const { user, journey } = await storedAt(1);
    const same = await books.saveBook(journey.id, user.id, {
      title: 'T',
      document: { ...doc('same'), schemaRev: 1 },
      baseVersion: 1,
    });
    expect(same && 'record' in same && same.record.version).toBe(2);

    const plain = await books.saveBook(journey.id, user.id, { title: 'T', document: doc('plain'), baseVersion: 2 });
    expect(plain && 'record' in plain && plain.record.version).toBe(3);
    const row = await findRow(await sharedTestOrm(testDb), JourneyBooks, { journey: journey.id });
    expect(JSON.parse(String(row?.document))).not.toHaveProperty('schemaRev');
  });

  it('JBOOK-014: the book tools leave a book this server cannot read whole alone, before any edit runs', async () => {
    const { user, journey } = await storedAt(2);
    const rec = await recordSends();
    try {
      const edit = vi.fn(() => ({ title: 'T', document: normalizeBookDocument(doc('tool')), result: null }));
      const thrown = await catchDomainError(() => books.editBook(journey.id, user.id, edit));
      expect(refusalOf(thrown)).toEqual([409, 'book_schema_newer', 'book_schema_newer']);
      expect(thrown instanceof DomainError && thrown.mcpMessage).toMatch(/newer version of TREK/);
      expect(edit).not.toHaveBeenCalled();
      expect(rec.sent).toEqual([]);
      expect((await books.getBook(journey.id, user.id))?.document.title).toBe('newer');
    } finally {
      rec.restore();
    }
  });

  it('JBOOK-015: an edit that hands back a document newer than this server reads is refused, the stored book untouched', async () => {
    const { user, journey } = await storedAt(1);
    const rec = await recordSends();
    try {
      const ahead = normalizeBookDocument({ ...doc('ahead'), schemaRev: 2 });
      const thrown = await catchDomainError(() =>
        books.editBook(journey.id, user.id, () => ({ title: 'T', document: ahead, result: null })),
      );
      expect(refusalOf(thrown)).toEqual([409, 'book_schema_newer', 'book_schema_newer']);
      expect(rec.sent).toEqual([]);
      const stored = await books.getBook(journey.id, user.id);
      expect([stored?.version, stored?.document.title, stored?.document.schemaRev]).toEqual([1, 'newer', 1]);
    } finally {
      rec.restore();
    }
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
