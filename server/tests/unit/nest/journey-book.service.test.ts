/**
 * Storing TREK Studio books (#1973).
 *
 * The half worth testing hard is concurrency. Every editor on a journey edits
 * the same book, so "two saves arrive together" is the ordinary case rather
 * than an edge one, and the failure mode of getting it wrong is somebody's
 * afternoon disappearing with no error anywhere.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => null,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createJourney, addJourneyContributor } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyBookService } from '../../../src/nest/journey/journey-book.service';
import { db as dbConn } from '../../../src/db/database';

const dbs = new DatabaseService(dbConn);
const domain = new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs));
const books = new JourneyBookService(dbs, domain);

/** A minimal document that survives normalizeBookDocument unchanged. */
function doc(title = 'one') {
  return {
    version: 1,
    title,
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 8 },
    spreads: [{ id: 's1', kind: 'inner', background: null, elements: [], parked: [] }],
  };
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// -- Access -------------------------------------------------------------------

describe('access', () => {
  it('refuses a journey the user cannot see', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(books.getBook(journey.id, stranger.id)).toBeNull();
    expect(books.saveBook(journey.id, stranger.id, { title: '', document: doc() })).toBeNull();
    expect(books.deleteBook(journey.id, stranger.id)).toBeNull();
    expect(books.canOpen(journey.id, stranger.id)).toBe(false);
  });

  /*
   * A book inherits its journey's access exactly. A second permission model
   * over the same object is how two rules end up disagreeing about who may do
   * what.
   */
  it('lets a contributor edit, not only the owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, helper.id, 'editor');

    const saved = books.saveBook(journey.id, helper.id, { title: 'B', document: doc() });
    expect(saved && 'record' in saved).toBe(true);
    expect(books.getBook(journey.id, helper.id)).not.toBeNull();
  });

  it('lets a viewer read the book but not overwrite or delete it', () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, guest.id, 'viewer');
    books.saveBook(journey.id, owner.id, { title: 'Iceland', document: doc() });

    expect(books.canOpen(journey.id, guest.id)).toBe(true);
    expect(books.getBook(journey.id, guest.id)).not.toBeNull();
    expect(books.saveBook(journey.id, guest.id, { title: 'mine now', document: doc('two') })).toBeNull();
    expect(books.deleteBook(journey.id, guest.id)).toBeNull();
    expect(books.getBook(journey.id, owner.id)!.title).toBe('Iceland');
  });

  it('says nothing about a journey that does not exist', () => {
    const { user } = createUser(testDb);
    expect(books.canOpen(999_999, user.id)).toBe(false);
    expect(books.getBook(999_999, user.id)).toBeNull();
  });
});

// -- Creating and reading -----------------------------------------------------

describe('creating and reading', () => {
  it('is null for a journey with no book yet', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    expect(books.getBook(journey.id, user.id)).toBeNull();
    expect(books.canOpen(journey.id, user.id)).toBe(true);
  });

  it('creates on first save, at version 1', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const saved = books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc() });
    expect(saved && 'record' in saved && saved.record.version).toBe(1);
    expect(saved && 'record' in saved && saved.record.title).toBe('Iceland');
  });

  it('reads the document back as it went in', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    const read = books.getBook(journey.id, user.id)!;
    expect(read.document.spreads).toHaveLength(1);
    expect(read.document.page.pageWidth).toBe(210);
  });

  it('records who saved it', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'T', document: doc() });
    expect(books.getBook(journey.id, user.id)!.updatedBy).toBe(user.id);
  });

  it('lists books without their documents', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'Iceland', document: doc() });

    const list = books.listBooks(journey.id, user.id)!;
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Iceland');
    expect('document' in list[0]).toBe(false);
  });

  /*
   * A document that will not parse still has to open. One drifted field should
   * not lock somebody out of their own book — normalizeBookDocument drops what
   * it cannot read rather than throwing.
   */
  it('opens a book whose stored JSON is broken, rather than throwing', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    testDb
      .prepare(
        "INSERT INTO journey_books (journey_id, title, document, version) VALUES (?, 'T', '{not json', 1)",
      )
      .run(journey.id);

    const read = books.getBook(journey.id, user.id);
    expect(read).not.toBeNull();
    expect(read!.document.spreads).toEqual([]);
  });
});

// -- Concurrency --------------------------------------------------------------

describe('concurrency', () => {
  function seed() {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'T', document: doc('one') });
    return { user, journey };
  }

  it('bumps the version on every save', () => {
    const { user, journey } = seed();
    const second = books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('two'),
      baseVersion: 1,
    });
    expect(second && 'record' in second && second.record.version).toBe(2);
  });

  /* The one this column exists for. */
  it('refuses a save made against a version that has moved', () => {
    const { user, journey } = seed();
    books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });

    const stale = books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale).toBe(true);
  });

  it('answers a conflict with the current record, not only a refusal', () => {
    const { user, journey } = seed();
    books.saveBook(journey.id, user.id, { title: 'Theirs', document: doc('two'), baseVersion: 1 });

    const stale = books.saveBook(journey.id, user.id, {
      title: 'Mine',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale && stale.conflict.version).toBe(2);
    expect(stale && 'conflict' in stale && stale.conflict.title).toBe('Theirs');
    expect(stale && 'conflict' in stale && stale.conflict.document.title).toBe('two');
  });

  it('leaves the stored document untouched when it refuses', () => {
    const { user, journey } = seed();
    books.saveBook(journey.id, user.id, { title: 'Theirs', document: doc('two'), baseVersion: 1 });
    books.saveBook(journey.id, user.id, { title: 'Mine', document: doc('three'), baseVersion: 1 });

    expect(books.getBook(journey.id, user.id)!.document.title).toBe('two');
    expect(books.getBook(journey.id, user.id)!.version).toBe(2);
  });

  /*
   * "Open Studio and start editing" has to work for the second person to
   * arrive, who has a document but no version yet.
   */
  it('takes a save with no base version as an ordinary write', () => {
    const { user, journey } = seed();
    const saved = books.saveBook(journey.id, user.id, { title: 'T', document: doc('two') });
    expect(saved && 'record' in saved && saved.record.version).toBe(2);
  });

  it('lets the loser save again once it has the new version', () => {
    const { user, journey } = seed();
    books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const conflict = books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('mine'),
      baseVersion: 1,
    });
    expect(conflict && 'conflict' in conflict).toBe(true);

    const retry = books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('mine'),
      baseVersion: 2,
    });
    expect(retry && 'record' in retry && retry.record.version).toBe(3);
    expect(books.getBook(journey.id, user.id)!.document.title).toBe('mine');
  });

  it('does not let a version from another journey unlock this one', () => {
    const { user, journey } = seed();
    const other = createJourney(testDb, user.id);
    books.saveBook(other.id, user.id, { title: 'O', document: doc('other') });

    // Version 1 is current over there and stale here.
    books.saveBook(journey.id, user.id, { title: 'T', document: doc('two'), baseVersion: 1 });
    const stale = books.saveBook(journey.id, user.id, {
      title: 'T',
      document: doc('three'),
      baseVersion: 1,
    });
    expect(stale && 'conflict' in stale).toBe(true);
    expect(books.getBook(other.id, user.id)!.version).toBe(1);
  });
});

// -- Broadcasting -------------------------------------------------------------

describe('broadcastSaved', () => {
  it('sends the version, not the document, and excludes the saver', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const saved = books.saveBook(journey.id, user.id, { title: 'T', document: doc() })!;
    const record = 'record' in saved ? saved.record : null;

    const spy = vi.spyOn(domain, 'broadcastJourneyEvent').mockImplementation(() => {});
    books.broadcastSaved(journey.id, user.id, record!, 'socket-7');

    expect(spy).toHaveBeenCalledWith(
      journey.id,
      'journey:book:saved',
      { version: 1, savedBy: user.id },
      'socket-7',
    );
    spy.mockRestore();
  });
});

// -- Deleting -----------------------------------------------------------------

describe('deleting', () => {
  it('removes the book and reports it', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    expect(books.deleteBook(journey.id, user.id)).toBe(true);
    expect(books.getBook(journey.id, user.id)).toBeNull();
  });

  it('reports false when there was nothing to delete', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    expect(books.deleteBook(journey.id, user.id)).toBe(false);
  });

  it('goes with the journey it belongs to', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    books.saveBook(journey.id, user.id, { title: 'T', document: doc() });

    testDb.prepare('DELETE FROM journeys WHERE id = ?').run(journey.id);

    const left = testDb
      .prepare('SELECT COUNT(*) AS n FROM journey_books WHERE journey_id = ?')
      .get(journey.id) as { n: number };
    expect(left.n).toBe(0);
  });
});
