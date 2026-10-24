/**
 * JourneyBookEditService: the Studio book tools' reads and writes over the
 * shared edit engine. The suite takes the service from JourneyBookModule over a
 * snapshot test db, so the access reads, the gallery and entry checks, the
 * transaction around each write and the realtime fake are the ones the app
 * uses.
 *
 * What it pins: the rights are the save route's (members read, the owner and
 * editors write, a viewer gets 403, an outsider 404); every operation family
 * writes what it says; a refused operation writes and sends nothing; the
 * cover, first, last and back pages stay; a photo must come from the journey's
 * gallery; `previous_spreads` comes back only when asked for; a move answers
 * where the page stood and a move to where it is writes nothing; a restore
 * lands only at the version it names, all the pages of one delete at once,
 * held to the gallery like an edit, or, naming the pages' digests the change
 * answered, only while those pages are as it left them; and a move or a
 * delete that names a version (the assistant's undo) lands only there too. A
 * held change is tried on the stored book with the journey's gallery and
 * entries, read with a member's rights.
 */
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
import { JourneyBookEditService, type BookWriteAnswer } from '../../../src/nest/journey/journey-book-edit.service';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { JourneyBookService } from '../../../src/nest/journey/journey-book.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { insertRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { bookPhotoElementSchema } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let edit: JourneyBookEditService;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyBookModule] });
  edit = t.get(JourneyBookEditService);
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

/** A photo in the journey's gallery, as the upload leaves it; its `trek_photos` id is what a book holds. */
async function galleryPhoto(journeyId: number, ownerId: number): Promise<number> {
  const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', owner: ownerId, file_path: 'journey/p.jpg' });
  await insertRow(orm, JourneyPhotos, { journey: journeyId, photo: photoId, sort_order: 0, created_at: Date.now() });
  return photoId;
}

/** A journey titled Lisbon with its owner, an editor, a viewer and someone outside it, and a blank book. */
async function crew() {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Lisbon' });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  const created = await edit.createBook(journey.id, owner.id, {});
  const idOf = (role: string) => created.pages.find((p) => p.role === role)?.id ?? `no ${role} page`;
  t.realtime.reset();
  return {
    owner,
    editor,
    viewer,
    stranger,
    journey,
    created,
    cover: idOf('cover'),
    first: idOf('first'),
    inner: idOf('inner'),
    everyone: [owner.id, editor.id, viewer.id].sort((a, b) => a - b),
  };
}

/** The refusal a call ends in, as status, code and the words a tool answers. */
async function refusal(pending: () => Promise<unknown>) {
  const err = await catchDomainError(pending);
  if (!(err instanceof DomainError)) throw new Error('the call was not refused');
  return { status: err.getStatus(), code: err.code, message: err.mcpMessage ?? err.publicMessage };
}

/** What each user was sent, as [user, event type, left-out socket], in user order. */
const sent = () =>
  t.realtime.broadcastToUserMock.mock.calls
    .map(([to, msg, sid]) => [to, (msg as { type: string }).type, sid] as const)
    .sort((a, b) => a[0] - b[0]);

const saved = (users: number[]) => users.map((id) => [id, 'journey:book:saved', undefined] as const);

const roles = async (journeyId: number, userId: number) =>
  (await edit.overview(journeyId, userId)).spreads.map((s) => s.role);

const firstPage = (answer: BookWriteAnswer) => answer.pages[0];

describe('creating and reading a book', () => {
  it('JBEDIT-001: create_book lays down the five pages in the format asked for, titled after the journey, and tells every member', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: editor } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id, { title: 'Porto' });
    await addJourneyContributor(orm, journey.id, editor.id, 'editor');

    const answer = await edit.createBook(journey.id, editor.id, { preset: 'a4-landscape' });

    expect(answer.version).toBe(1);
    expect(answer.pages.map((p) => p.role)).toEqual(['cover', 'first', 'inner', 'last', 'back']);
    expect(answer.spread_ids).toEqual(answer.pages.map((p) => p.id));
    expect('previous_spreads' in answer).toBe(false);
    const book = await edit.overview(journey.id, owner.id);
    expect([book.exists, book.version, book.title, book.page.preset, book.page.pageWidth]).toEqual([
      true,
      1,
      'Porto',
      'a4-landscape',
      297,
    ]);
    expect(sent()).toEqual(saved([owner.id, editor.id].sort((a, b) => a - b)));
  });

  it('JBEDIT-002: a second book, a viewer and an outsider are refused, and nothing is sent for any of them', async () => {
    const { journey, viewer, stranger, owner } = await crew();

    expect(await refusal(() => edit.createBook(journey.id, owner.id, { title: 'Again' }))).toMatchObject({
      status: 409,
      code: 'book_exists',
    });
    const bare = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, bare.id, viewer.id, 'viewer');
    expect(await refusal(() => edit.createBook(bare.id, viewer.id, {}))).toMatchObject({ status: 403 });
    expect(await refusal(() => edit.createBook(bare.id, stranger.id, {}))).toEqual({
      status: 404,
      code: 'not_found',
      message: 'Journey not found or access denied.',
    });
    expect(sent()).toEqual([]);
    expect((await edit.overview(journey.id, owner.id)).version).toBe(1);
    expect((await edit.overview(bare.id, owner.id)).exists).toBe(false);
  });

  it('JBEDIT-003: any member reads the book and its pages, an outsider is told the journey is not there', async () => {
    const { journey, viewer, stranger, owner, inner } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);
    await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'place_photo', photoId: photo, target: 'new' }],
    });

    const page = await edit.describePage(journey.id, viewer.id, inner);
    expect(page.role).toBe('inner');
    expect(page.elements.map((e) => [e.kind, e.photoId])).toEqual([['photo', photo]]);
    expect(page.text).toContain('Findings');
    expect((await edit.overview(journey.id, viewer.id)).spreads[2]?.photoIds).toEqual([photo]);
    const layouts = await edit.layouts(journey.id, viewer.id, 'single');
    expect([layouts.inner, layouts.single.length > 0, typeof layouts.notes.grids]).toEqual([[], true, 'string']);

    expect(await refusal(() => edit.describePage(journey.id, viewer.id, 'sp-nowhere'))).toMatchObject({
      status: 404,
      code: 'book_page_missing',
    });
    expect(await refusal(() => edit.overview(journey.id, stranger.id))).toMatchObject({ status: 404 });
    const bare = await makeJourney(orm, owner.id);
    expect(await refusal(() => edit.describePage(bare.id, owner.id, inner))).toMatchObject({
      status: 404,
      code: 'book_missing',
    });
    const paper = [{ op: 'background' as const, color: null }];
    expect(await refusal(() => edit.editPage(bare.id, owner.id, { spreadId: inner, ops: paper }))).toMatchObject({
      status: 404,
      code: 'book_missing',
    });
  });

  it('JBEDIT-013: a change is tried on the stored book with the gallery and entries, by any member, never by an outsider', async () => {
    const { journey, viewer, stranger, owner, created } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);
    const entry = await makeJourneyEntry(orm, journey.id, owner.id, { title: 'Alfama' });

    const base = await edit.trialBase(journey.id, viewer.id);
    expect(base.version).toBe(created.version);
    expect(base.doc?.spreads.map((s) => s.id)).toEqual(created.spread_ids);
    expect(base.ctx.photos?.map((p) => p.photoId)).toEqual([photo]);
    expect(base.ctx.journey?.title).toBe('Lisbon');
    expect(base.ctx.journey?.entries?.map((e) => e.id)).toEqual([entry.id]);
    const bare = await makeJourney(orm, owner.id);
    expect(await edit.trialBase(bare.id, owner.id)).toMatchObject({ doc: null, version: null });
    expect(await refusal(() => edit.trialBase(journey.id, stranger.id))).toMatchObject({ status: 404 });
    expect(sent()).toEqual([]);
  });
});

describe('editing a page', () => {
  it('JBEDIT-004: edit_book_page places a gallery photo, answers the page with its findings, and is what GET reads', async () => {
    const { journey, editor, owner, inner, everyone } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);

    const answer = await edit.editPage(journey.id, editor.id, {
      spreadId: inner,
      ops: [
        { op: 'place_photo', photoId: photo, target: 'new' },
        { op: 'background', color: '#f4efe6' },
      ],
    });

    expect(answer.version).toBe(2);
    expect(answer.spread_ids).toEqual([inner]);
    expect(firstPage(answer)).toMatchObject({ id: inner, index: 2, photoIds: [photo], background: '#f4efe6' });
    expect(Array.isArray(answer.findings)).toBe(true);
    expect(answer.dropped).toEqual([]);
    expect('previous_spreads' in answer).toBe(false);
    const stored = await t.get(JourneyBookService).getBook(journey.id, owner.id);
    expect(stored?.version).toBe(2);
    expect(stored?.document.spreads[2]?.background).toBe('#f4efe6');
    expect(sent()).toEqual(saved(everyone));
  });

  it('JBEDIT-016: an edit answers whether the page reads as designed: a cover with a small title alone is flat', async () => {
    const { journey, editor, cover } = await crew();
    const answer = await edit.editPage(journey.id, editor.id, {
      spreadId: cover,
      ops: [{ op: 'text', role: 'heading', text: 'Lisbon', size: 24 }],
    });
    expect(answer.findings).toContainEqual(expect.objectContaining({ code: 'flat_cover', severity: 'warn' }));
  });

  it('JBEDIT-005: previous_spreads holds the page as it was, only when the call asks for it', async () => {
    const { journey, owner, inner } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);
    await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'place_photo', photoId: photo, target: 'new' }],
    });

    const answer = await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'background', color: '#101010' }],
      returnPrevious: true,
    });

    expect(answer.previous_spreads).toHaveLength(1);
    const previous = answer.previous_spreads?.[0];
    expect([previous?.index, previous?.spread.id, previous?.spread.background]).toEqual([2, inner, null]);
    expect(previous?.spread.elements.map((e) => e.kind)).toEqual(['photo']);
  });

  it('JBEDIT-006: a photo from outside the gallery, a locked element or a viewer is refused whole: nothing written, nothing sent', async () => {
    const { journey, owner, viewer, inner } = await crew();
    const other = await makeJourney(orm, owner.id);
    const foreign = await galleryPhoto(other.id, owner.id);
    const mine = await galleryPhoto(journey.id, owner.id);

    expect(
      await refusal(() =>
        edit.editPage(journey.id, owner.id, {
          spreadId: inner,
          ops: [
            { op: 'background', color: '#222222' },
            { op: 'place_photo', photoId: foreign, target: 'new' },
          ],
        }),
      ),
    ).toEqual({
      status: 422,
      code: 'book_photo_not_in_gallery',
      message: `ops[1]: photo ${foreign} is not in this journey's gallery`,
    });

    const books = t.get(JourneyBookService);
    const book = await books.getBook(journey.id, owner.id);
    if (!book) throw new Error('the crew has a book');
    const locked = { id: 'p-lock', kind: 'photo', frame: { x: 20, y: 20, w: 60, h: 40 }, locked: true, photoId: mine };
    const document = {
      ...book.document,
      spreads: book.document.spreads.map((s) => (s.id === inner ? { ...s, elements: [locked] } : s)),
    };
    await books.saveBook(journey.id, owner.id, { title: book.title, document, baseVersion: book.version });
    t.realtime.reset();

    expect(
      await refusal(() =>
        edit.editPage(journey.id, owner.id, { spreadId: inner, ops: [{ op: 'frame', elementId: 'p-lock', x: 0 }] }),
      ),
    ).toMatchObject({ status: 422, code: 'book_locked' });
    const paper = [{ op: 'background' as const, color: null }];
    expect(await refusal(() => edit.editPage(journey.id, viewer.id, { spreadId: inner, ops: paper }))).toMatchObject({
      status: 403,
    });

    const after = await books.getBook(journey.id, owner.id);
    expect([after?.version, after?.document.spreads[2]?.background]).toEqual([2, null]);
    expect(sent()).toEqual([]);
  });

  it('JBEDIT-007: set_book_cover puts a gallery photo and the title on the cover, keeping what it replaced on request', async () => {
    const { journey, owner, cover } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);

    const answer = await edit.setCover(journey.id, owner.id, {
      photoId: photo,
      title: 'Lisbon 2026',
      returnPrevious: true,
    });

    expect(answer.spread_ids).toEqual([cover]);
    expect(firstPage(answer)).toMatchObject({ role: 'cover', photoIds: [photo] });
    expect(firstPage(answer)?.texts).toContain('Lisbon 2026');
    expect(answer.previous_spreads?.map((p) => [p.index, p.spread.elements.length])).toEqual([[0, 0]]);
  });
});

describe('adding, moving, deleting and restoring pages', () => {
  it('JBEDIT-008: add_book_pages keeps new pages inside the covers and ties them to an entry of this journey only', async () => {
    const { journey, owner, cover } = await crew();
    const entry = await makeJourneyEntry(orm, journey.id, owner.id);
    const elsewhere = await makeJourney(orm, owner.id);
    const foreignEntry = await makeJourneyEntry(orm, elsewhere.id, owner.id);

    const answer = await edit.addPages(journey.id, owner.id, { afterSpreadId: cover, count: 2, entryId: entry.id });

    expect(answer.pages.map((p) => [p.index, p.role, p.entryId])).toEqual([
      [2, 'inner', entry.id],
      [3, 'inner', entry.id],
    ]);
    expect(await roles(journey.id, owner.id)).toEqual(['cover', 'first', 'inner', 'inner', 'inner', 'last', 'back']);
    expect(
      await refusal(() => edit.addPages(journey.id, owner.id, { afterSpreadId: cover, entryId: foreignEntry.id })),
    ).toMatchObject({ status: 422, code: 'book_entry_not_found' });
    expect((await edit.overview(journey.id, owner.id)).version).toBe(2);
  });

  it('JBEDIT-009: the cover, first, last and back pages are neither moved nor deleted; an inner page is', async () => {
    const { journey, owner, cover, first, inner, everyone } = await crew();

    expect(await refusal(() => edit.deletePages(journey.id, owner.id, { spreadIds: [cover] }))).toMatchObject({
      status: 422,
      code: 'book_protected_spread',
    });
    expect(await refusal(() => edit.movePage(journey.id, owner.id, { spreadId: first, toIndex: 2 }))).toMatchObject({
      status: 422,
      code: 'book_protected_spread',
    });
    await edit.addPages(journey.id, owner.id, { afterSpreadId: inner });
    t.realtime.reset();
    const moved = await edit.movePage(journey.id, owner.id, { spreadId: inner, toIndex: 3 });
    expect(firstPage(moved)).toMatchObject({ id: inner, index: 3 });
    expect([moved.from_index, moved.version]).toEqual([2, 3]);
    expect(sent()).toEqual(saved(everyone));

    // Already there: nothing is written, the version stays and nobody is told.
    t.realtime.reset();
    const stay = await edit.movePage(journey.id, owner.id, { spreadId: inner, toIndex: 3 });
    expect([stay.from_index, stay.version, firstPage(stay)?.index]).toEqual([3, 3, 3]);
    expect(sent()).toEqual([]);
    expect((await edit.overview(journey.id, owner.id)).version).toBe(3);

    const gone = await edit.deletePages(journey.id, owner.id, { spreadIds: [inner] });
    expect([gone.spread_ids, gone.pages, 'previous_spreads' in gone]).toEqual([[inner], [], false]);
    expect(await roles(journey.id, owner.id)).toEqual(['cover', 'first', 'inner', 'last', 'back']);
  });

  it('JBEDIT-010: a deleted page comes back with restore_book_page at the version the delete left, never over a later save', async () => {
    const { journey, owner, inner } = await crew();
    const gone = await edit.deletePages(journey.id, owner.id, { spreadIds: [inner], returnPrevious: true });
    const previous = gone.previous_spreads?.[0];
    if (!previous) throw new Error('the delete kept no page');
    expect(previous.index).toBe(2);

    const stale = await refusal(() =>
      edit.restorePage(journey.id, owner.id, { pages: [previous], expectedVersion: 1 }),
    );
    expect(stale).toMatchObject({ status: 409, code: 'book_conflict' });

    const back = await edit.restorePage(journey.id, owner.id, { pages: [previous], expectedVersion: gone.version });
    expect(firstPage(back)).toMatchObject({ id: inner, index: 2, role: 'inner' });
    expect(back.version).toBe(gone.version + 1);
  });

  it('JBEDIT-011: several pages deleted in one call come back in one restore, each where it was', async () => {
    const { journey, owner, inner, everyone } = await crew();
    const added = await edit.addPages(journey.id, owner.id, { afterSpreadId: inner, count: 3 });
    const before = (await edit.overview(journey.id, owner.id)).spreads.map((s) => s.id);
    const doomed = [added.spread_ids[2], inner, added.spread_ids[0]].filter((id): id is string => !!id);

    const gone = await edit.deletePages(journey.id, owner.id, { spreadIds: doomed, returnPrevious: true });

    expect(gone.previous_spreads?.map((p) => p.index)).toEqual([2, 3, 5]);
    expect((await edit.overview(journey.id, owner.id)).spreads).toHaveLength(before.length - 3);
    const previous = gone.previous_spreads ?? [];
    t.realtime.reset();
    const back = await edit.restorePage(journey.id, owner.id, { pages: previous, expectedVersion: gone.version });
    expect(back.version).toBe(gone.version + 1);
    expect(back.pages.map((p) => [p.id, p.index])).toEqual(previous.map((p) => [p.spread.id, p.index]));
    expect((await edit.overview(journey.id, owner.id)).spreads.map((s) => s.id)).toEqual(before);
    expect(sent()).toEqual(saved(everyone));
  });

  it('JBEDIT-012: a restore brings no photo that is neither in the gallery nor in the book, and writes nothing then', async () => {
    const { journey, owner, inner } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);
    const other = await makeJourney(orm, owner.id);
    const foreign = await galleryPhoto(other.id, owner.id);
    const placed = await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'place_photo', photoId: photo, target: 'new' }],
      returnPrevious: true,
    });
    const page = placed.previous_spreads?.[0];
    if (!page) throw new Error('the edit kept no page');
    const frame = bookPhotoElementSchema.parse({
      id: 'p-stray',
      kind: 'photo',
      frame: { x: 10, y: 10, w: 50, h: 50 },
      photoId: foreign,
    });
    const stray = { index: page.index, spread: { ...page.spread, elements: [frame] } };
    t.realtime.reset();

    expect(
      await refusal(() => edit.restorePage(journey.id, owner.id, { pages: [stray], expectedVersion: placed.version })),
    ).toMatchObject({ status: 422, code: 'book_photo_not_in_gallery' });
    expect((await edit.overview(journey.id, owner.id)).version).toBe(placed.version);
    expect(sent()).toEqual([]);

    // The page as the edit found it comes back: an honest undo always passes.
    const undone = await edit.restorePage(journey.id, owner.id, { pages: [page], expectedVersion: placed.version });
    expect(firstPage(undone)?.photoIds).toEqual([]);
  });

  it('JBEDIT-014: a move or a delete naming expectedVersion lands only at that version, never over a later save', async () => {
    const { journey, owner, inner } = await crew();
    const added = await edit.addPages(journey.id, owner.id, { afterSpreadId: inner, count: 2 });
    const [fresh] = added.spread_ids;
    if (!fresh) throw new Error('no page was added');
    t.realtime.reset();

    const stale = added.version - 1;
    expect(
      await refusal(() => edit.movePage(journey.id, owner.id, { spreadId: inner, toIndex: 4, expectedVersion: stale })),
    ).toMatchObject({ status: 409, code: 'book_conflict' });
    expect(
      await refusal(() => edit.deletePages(journey.id, owner.id, { spreadIds: [fresh], expectedVersion: stale })),
    ).toMatchObject({ status: 409, code: 'book_conflict' });
    expect((await edit.overview(journey.id, owner.id)).version).toBe(added.version);
    expect(sent()).toEqual([]);

    const moved = await edit.movePage(journey.id, owner.id, {
      spreadId: inner,
      toIndex: 4,
      expectedVersion: added.version,
    });
    expect(moved.version).toBe(added.version + 1);
    const gone = await edit.deletePages(journey.id, owner.id, { spreadIds: [fresh], expectedVersion: moved.version });
    expect(gone.version).toBe(moved.version + 1);
  });

  it('JBEDIT-015: a restore naming expectedPages checks those pages only: another page saved since lets it land, the page itself not', async () => {
    const { journey, owner, inner, first } = await crew();
    const edited = await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'background', color: '#f4efe6' }],
      returnPrevious: true,
    });
    const pages = edited.previous_spreads ?? [];
    const expectedPages = edited.page_digests ?? [];
    expect(expectedPages).toEqual([{ spreadId: inner, digest: expect.stringMatching(/^[0-9a-f]{16}$/) }]);
    const dark = await edit.editPage(journey.id, owner.id, {
      spreadId: first,
      ops: [{ op: 'background', color: '#101010' }],
      returnPrevious: true,
    });
    expect(dark.page_digests).toEqual([{ spreadId: first, digest: expect.stringMatching(/^[0-9a-f]{16}$/) }]);

    // The book moved on with the first page, the edited page did not: the version refuses, the page lets it land.
    const byVersion = () => edit.restorePage(journey.id, owner.id, { pages, expectedVersion: edited.version });
    expect(await refusal(byVersion)).toMatchObject({ status: 409, code: 'book_conflict' });
    // Digests that leave out a page put back do not stand in for the version, even while they hold.
    const others = () =>
      edit.restorePage(journey.id, owner.id, {
        pages,
        expectedVersion: edited.version,
        expectedPages: dark.page_digests ?? [],
      });
    expect(await refusal(others)).toMatchObject({ status: 409, code: 'book_conflict' });
    const byPage = () =>
      edit.restorePage(journey.id, owner.id, { pages, expectedVersion: edited.version, expectedPages });
    expect(firstPage(await byPage())).toMatchObject({ id: inner, background: null });
    const kept = await edit.overview(journey.id, owner.id);
    expect(kept.spreads.find((s) => s.id === first)?.background).toBe('#101010');

    // Once the page itself was saved since, the same restore is refused: nothing written, nothing sent.
    const again = await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'background', color: '#222222' }],
    });
    expect(again).not.toHaveProperty('page_digests');
    const version = (await edit.overview(journey.id, owner.id)).version;
    t.realtime.reset();
    expect(await refusal(byPage)).toMatchObject({ status: 409, code: 'book_conflict' });
    expect((await edit.overview(journey.id, owner.id)).version).toBe(version);
    expect(sent()).toEqual([]);

    // A page the change took out has no digest; one named with a digest refuses, whatever the version says.
    const gone = await edit.deletePages(journey.id, owner.id, { spreadIds: [inner], returnPrevious: true });
    expect(gone.page_digests).toEqual([{ spreadId: inner, digest: null }]);
    const restore = (expected: Array<{ spreadId: string; digest: string | null }>, expectedVersion: number) =>
      edit.restorePage(journey.id, owner.id, {
        pages: gone.previous_spreads ?? [],
        expectedVersion,
        expectedPages: expected,
      });
    const named = [{ spreadId: inner, digest: '0123456789abcdef' }];
    expect(await refusal(() => restore(named, 0))).toMatchObject({ status: 409, code: 'book_conflict' });
    // A page named as gone goes back at its old index, which means the same only at the version: a stale one refuses.
    const asGone = [{ spreadId: inner, digest: null }];
    expect(await refusal(() => restore(asGone, 0))).toMatchObject({ status: 409, code: 'book_conflict' });
    // A page named as gone that is still in the book refuses even at the version.
    const stillThere = [...asGone, { spreadId: first, digest: null }];
    expect(await refusal(() => restore(stillThere, gone.version))).toMatchObject({
      status: 409,
      code: 'book_conflict',
    });
    expect(firstPage(await restore(asGone, gone.version))).toMatchObject({ id: inner, index: 2 });
  });
});
