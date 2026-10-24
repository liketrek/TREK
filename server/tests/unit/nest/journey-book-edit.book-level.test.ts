/**
 * JourneyBookEditService, the book-level tools and what the engine now knows
 * (JBLVL-*): the page format and numbers set and set back at a version, a
 * page copied, a layout kept, taken away and put back, with no photo from
 * outside the journey's gallery; a page of a design
 * draft read instead of the book's (410 once the draft is gone); the print
 * check reading the original's size from the pixel signals; and the travel
 * context in the user's language. Taken from JourneyBookModule over a
 * snapshot test db, with the realtime fake.
 */
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotoSignals } from '../../../src/db/entities/TrekPhotoSignals.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
import { BookDesignDraftStore, BOOK_DESIGN_DRAFTS } from '../../../src/nest/journey/book-design-draft.store';
import { JourneyBookEditService } from '../../../src/nest/journey/journey-book-edit.service';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { PHOTO_SIGNALS_ALGO } from '../../../src/nest/photos/photo-signals-runner';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { insertRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { blankBook, type BookDocument } from '@trek/shared';

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

/** A photo in the journey's gallery; its `trek_photos` id is what a book holds. */
async function galleryPhoto(journeyId: number, ownerId: number): Promise<number> {
  const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', owner: ownerId, file_path: 'journey/p.jpg' });
  await insertRow(orm, JourneyPhotos, { journey: journeyId, photo: photoId, sort_order: 0, created_at: Date.now() });
  return photoId;
}

/** A journey with its owner, an editor and a viewer, and a blank book. */
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
  return { status: err.getStatus(), code: err.code, message: err.mcpMessage ?? err.publicMessage };
}

const sentCount = () => t.realtime.broadcastToUserMock.mock.calls.length;

describe('the book-level tools', () => {
  it('JBLVL-001: set_book_setup changes the format and numbers, answers the setup as it was, and sets it back at a version', async () => {
    const { journey, owner, created } = await crew();

    const changed = await edit.setSetup(journey.id, owner.id, {
      preset: 'a4-landscape',
      pageNumbers: { show: true, position: 'centre' },
    });

    expect(changed.version).toBe(created.version + 1);
    expect(changed.previous_setup).toMatchObject({ preset: 'square-210', pageWidth: 210 });
    const page = (await edit.overview(journey.id, owner.id)).page;
    expect([page.preset, page.pageWidth]).toEqual(['a4-landscape', 297]);

    const previous = changed.previous_setup;
    if (!previous) throw new Error('no previous setup');
    const back = { ...previous, pageNumbers: { ...previous.pageNumbers } };
    expect(await refusal(() => edit.setSetup(journey.id, owner.id, { ...back, expectedVersion: 1 }))).toMatchObject({
      status: 409,
    });
    const undone = await edit.setSetup(journey.id, owner.id, { ...back, expectedVersion: changed.version });
    expect((await edit.overview(journey.id, owner.id)).page.preset).toBe('square-210');

    const sent = sentCount();
    const same = await edit.setSetup(journey.id, owner.id, { preset: 'square-210' });
    expect(same.version).toBe(undone.version);
    expect(sentCount()).toBe(sent);
  });

  it('JBLVL-002: duplicate_book_page copies an inner page after it; a viewer and the cover are refused', async () => {
    const { journey, owner, viewer, created, inner } = await crew();

    const copied = await edit.duplicatePage(journey.id, owner.id, { spreadId: inner });

    const roles = (await edit.overview(journey.id, owner.id)).spreads.map((s) => s.role);
    expect(roles).toEqual(['cover', 'first', 'inner', 'inner', 'last', 'back']);
    expect(copied.spread_ids).toHaveLength(1);
    expect(copied.spread_ids[0]).not.toBe(inner);
    expect(await refusal(() => edit.duplicatePage(journey.id, viewer.id, { spreadId: inner }))).toMatchObject({
      status: 403,
    });
    const cover = created.pages[0]?.id ?? '';
    expect(await refusal(() => edit.duplicatePage(journey.id, owner.id, { spreadId: cover }))).toMatchObject({
      status: 422,
      code: 'book_protected_spread',
    });
  });

  it('JBLVL-003: a layout is kept under its id, taken away with the layout as it was, and put back at a version', async () => {
    const { journey, owner, inner } = await crew();

    const saved = await edit.saveLayout(journey.id, owner.id, { spreadId: inner, name: 'Two photos' });
    const layoutId = saved.layout_id ?? '';
    expect(layoutId).not.toBe('');
    expect((await edit.overview(journey.id, owner.id)).layouts.map((l) => l.name)).toEqual(['Two photos']);

    const removed = await edit.removeLayout(journey.id, owner.id, { layoutId, expectedVersion: saved.version });
    expect(removed.previous_layout).toMatchObject({ id: layoutId, name: 'Two photos' });
    expect((await edit.overview(journey.id, owner.id)).layouts).toEqual([]);

    const layout = JSON.stringify(removed.previous_layout);
    const stale = { layout, expectedVersion: 1 };
    expect(await refusal(() => edit.restoreLayout(journey.id, owner.id, stale))).toMatchObject({ status: 409 });
    await edit.restoreLayout(journey.id, owner.id, { layout, expectedVersion: removed.version });
    expect((await edit.overview(journey.id, owner.id)).layouts.map((l) => l.id)).toEqual([layoutId]);

    const broken = { layout: '{not json', expectedVersion: (await edit.overview(journey.id, owner.id)).version ?? 0 };
    expect(await refusal(() => edit.restoreLayout(journey.id, owner.id, broken))).toMatchObject({
      status: 422,
      code: 'book_invalid_op',
    });
  });
});

describe('what a restore may bring back', () => {
  it('JBLVL-007: restore_book_layout takes no photo from outside the gallery or the book, letters too', async () => {
    const { journey, owner, inner } = await crew();
    const mine = await galleryPhoto(journey.id, owner.id);
    const elsewhere = await makeJourney(orm, owner.id, { title: 'Porto' });
    const foreign = await galleryPhoto(elsewhere.id, owner.id);
    const saved = await edit.saveLayout(journey.id, owner.id, { spreadId: inner, name: 'Two photos' });
    const layoutId = saved.layout_id ?? '';
    const removed = await edit.removeLayout(journey.id, owner.id, { layoutId, expectedVersion: saved.version });
    const layout = removed.previous_layout;
    if (!layout) throw new Error('no layout answered');
    const frame = { x: 10, y: 10, w: 80, h: 80 };
    const framed = (photoId: number) =>
      JSON.stringify({ ...layout, elements: [...layout.elements, { id: 'p-x', kind: 'photo', frame, photoId }] });
    const lettered = (photoId: number) =>
      JSON.stringify({
        ...layout,
        elements: [{ id: 't-x', kind: 'text', frame, text: 'Porto', fillPaint: { type: 'photo', photoId } }],
      });
    const at = removed.version;
    const restore = (json: string) =>
      refusal(() => edit.restoreLayout(journey.id, owner.id, { layout: json, expectedVersion: at }));
    const stray = { status: 422, code: 'book_photo_not_in_gallery' };

    expect(await restore(framed(foreign))).toMatchObject(stray);
    expect(await restore(lettered(foreign))).toMatchObject(stray);
    const back = await edit.restoreLayout(journey.id, owner.id, { layout: framed(mine), expectedVersion: at });
    expect(back.version).toBe(at + 1);
    expect((await edit.overview(journey.id, owner.id)).layouts.map((l) => l.id)).toEqual([layoutId]);
  });
});

describe('what the engine reads', () => {
  it('JBLVL-004: describe_book_page and a trial read a page of a design draft, its maker only, 410 once it is gone', async () => {
    const { journey, owner, viewer } = await crew();
    const draftDoc: BookDocument = blankBook({ title: 'Draft', newId: (prefix) => `${prefix}-draft` });
    await t.get(BookDesignDraftStore).put({
      designId: 'd-one',
      userId: owner.id,
      journeyId: journey.id,
      baseVersion: 1,
      base: null,
      doc: draftDoc,
      plan: [],
      selection: [],
      style: { style: 'classic', paper: '#ffffff', ink: '#1a1a1a', accent: '#c2410c', heading: 'sans', body: 'sans' },
      usedPhotos: 0,
      leftOut: [],
      findings: [],
      notes: [],
      expiresAt: Date.now() + BOOK_DESIGN_DRAFTS.ttlMs,
    });

    const page = await edit.describePage(journey.id, owner.id, 'sp-draft', 'd-one');
    expect([page.spreadId, page.role]).toEqual(['sp-draft', 'cover']);
    const base = await edit.trialBase(journey.id, owner.id, 'd-one');
    expect([base.version, base.doc?.title]).toEqual([1, 'Draft']);

    expect(await refusal(() => edit.describePage(journey.id, viewer.id, 'sp-draft', 'd-one'))).toMatchObject({
      status: 410,
      code: 'book_design_expired',
    });
    expect(await refusal(() => edit.trialBase(journey.id, owner.id, 'd-none'))).toMatchObject({ status: 410 });
  });

  it("JBLVL-005: the print check reads the original's size from the pixel signals, with the colours the design findings read", async () => {
    const { journey, owner, inner } = await crew();
    const photo = await galleryPhoto(journey.id, owner.id);
    await insertRow(orm, TrekPhotoSignals, {
      photo,
      algo: PHOTO_SIGNALS_ALGO,
      orig_width: 320,
      orig_height: 240,
      palette: '["#336699:1.00"]',
      busy: '0'.repeat(64),
    });

    const answer = await edit.editPage(journey.id, owner.id, {
      spreadId: inner,
      ops: [{ op: 'place_photo', photoId: photo, target: 'new' }],
    });

    expect(answer.findings.map((f) => f.code)).toContain('low_dpi');
    const base = await edit.trialBase(journey.id, owner.id);
    expect(base.ctx.photos?.[0]).toMatchObject({ photoId: photo, width: 320, height: 240, palette: ['#336699:1.00'] });
  });

  it("JBLVL-006: the travel context holds the journey's entries and the words in the user's language", async () => {
    const { journey, owner } = await crew();
    const entry = await makeJourneyEntry(orm, journey.id, owner.id, { title: 'Alfama', mood: 'amazing' });
    await makeJourneyEntry(orm, journey.id, owner.id, { type: 'skeleton' });
    await t.get(SettingsService).upsertSetting(owner.id, 'language', 'de');

    const travel = await edit.travelContext(journey.id, owner.id);

    expect(travel.entries.map((e) => [e.id, e.title, e.mood])).toEqual([[entry.id, 'Alfama', 'amazing']]);
    expect(travel.locale).toBe('de-DE');
    expect(travel.labels).toMatchObject({ day: 'TAG {day}', stations: 'Stationen', pros: 'Pro', cons: 'Contra' });
    expect(travel.path).toEqual([]);
    expect((await edit.wordsFor(owner.id)).locale).toBe('de-DE');
  });
});
