/**
 * JourneyBookDesignService (JBDSN-*): the assistant's whole-book design over
 * the shared engine. Taken from JourneyBookDesignModule over a snapshot test
 * db, with the realtime fake and the photo bytes stubbed (nothing to measure).
 *
 * What it pins: a design is a draft, nothing written or sent, made and
 * applied by the owner and editors only (a viewer 403, an outsider 404, before
 * any draft is looked for) and read back by its maker only (410 for anyone
 * else and once it is gone); a revision of a draft page is checked like an
 * edit and changes only the draft, a kept page it revises is proposed; the
 * selection names only pages the plan changes; the apply writes the chosen
 * pages in one version with one announcement, keeps the book as it was as a
 * revision in the same transaction, names the pages left out and the ones
 * changed since, refuses when nothing is left (409, nothing written) and at a
 * stale version, and forgets the draft; a journey without a book gets a new
 * one and no revision; restoring the revision puts the book back only at the
 * version the apply left, and never writes a revision that does not read
 * back or that a newer TREK kept; five revisions are kept; a design made
 * with a brief composes its archetype cover and is decorated from the sticker
 * library the service hands the engine, and a page of it revised later is
 * judged against that brief.
 */
import { JourneyBookRevisions } from '../../../../src/db/entities/JourneyBookRevisions.entity';
import { JourneyEntryPhotos } from '../../../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import { catchDomainError, DomainError } from '../../../../src/nest/common/domain-error';
import { JourneyBookDesignModule } from '../../../../src/nest/journey/journey-book-design.module';
import { JourneyBookDesignService } from '../../../../src/nest/journey/journey-book-design.service';
import { JourneyBookEditService } from '../../../../src/nest/journey/journey-book-edit.service';
import { JourneyBookService } from '../../../../src/nest/journey/journey-book.service';
import { PhotoResolverService } from '../../../../src/nest/memories/photo-resolver.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../../helpers/factories/journeys';
import { countRows, findRow, insertRow, updateRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import {
  BOOK_SCHEMA_REV,
  bookDesignAnswerSchema,
  bookDesignApplyResultSchema,
  type BookDesignAnswer,
} from '@trek/shared';
import { BOOK_STICKERS } from '@trek/shared/stickers';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let designs: JourneyBookDesignService;
let edit: JourneyBookEditService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyBookDesignModule],
    overrides: [{ provide: PhotoResolverService, useValue: { readForSignals: async () => ({ kind: 'none' }) } }],
  });
  designs = t.get(JourneyBookDesignService);
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

/** An entry with a story and a photo of the journey's gallery on it. */
async function entryWithPhoto(journeyId: number, ownerId: number, title: string, date: string) {
  const entry = await makeJourneyEntry(orm, journeyId, ownerId, { title, entry_date: date, story: `${title} in May.` });
  const photo = await insertRow(orm, TrekPhotos, {
    provider: 'local',
    owner: ownerId,
    file_path: 'journey/p.jpg',
    width: 1600,
    height: 1200,
  });
  const galleryId = await insertRow(orm, JourneyPhotos, {
    journey: journeyId,
    photo,
    sort_order: 0,
    created_at: Date.now(),
  });
  await insertRow(orm, JourneyEntryPhotos, { entry: entry.id, journeyPhoto: galleryId, created_at: Date.now() });
  return { entry, photo };
}

/** A journey with its owner, an editor, a viewer and someone outside it, two entries, and (unless told) a book. */
async function crew({ withBook = true } = {}) {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Lisbon' });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  await entryWithPhoto(journey.id, owner.id, 'Alfama', '2026-05-02');
  await entryWithPhoto(journey.id, owner.id, 'Belem', '2026-05-03');
  const created = withBook ? await edit.createBook(journey.id, owner.id, {}) : null;
  t.realtime.reset();
  const everyone = [owner.id, editor.id, viewer.id].sort((a, b) => a - b);
  return { owner, editor, viewer, stranger, journey, created, everyone };
}

async function refusal(pending: () => Promise<unknown>) {
  const err = await catchDomainError(pending);
  if (!(err instanceof DomainError)) throw new Error('the call was not refused');
  return { status: err.getStatus(), code: err.code };
}

/** Who was told the book moved on, in user order. */
const told = () =>
  t.realtime.broadcastToUserMock.mock.calls
    .filter(([, msg]) => (msg as { type: string }).type === 'journey:book:saved')
    .map(([to]) => to)
    .sort((a, b) => a - b);

const version = async (journeyId: number, userId: number) => (await edit.overview(journeyId, userId)).version;

/** The pages of a plan the apply writes unless the person takes some out. */
const changing = (answer: BookDesignAnswer) =>
  answer.plan.filter((row) => row.action !== 'keep' && row.action !== 'drop').map((row) => row.spreadId);

/** The pages of a plan it would drop, which stay unless the person picks them. */
const dropping = (answer: BookDesignAnswer) =>
  answer.plan.filter((row) => row.action === 'drop').map((row) => ({ spreadId: row.spreadId, reason: 'excluded' }));

describe('a design draft', () => {
  it('JBDSN-001: design_book answers a whole plan over the stored book and writes and sends nothing', async () => {
    const { journey, editor, created } = await crew();

    const answer = await designs.design(journey.id, editor.id, {});

    expect(bookDesignAnswerSchema.parse(answer)).toEqual(answer);
    expect(answer.design_id).toMatch(/^d-[\w-]+$/);
    expect([answer.journey_id, answer.base_version]).toEqual([journey.id, created?.version]);
    expect(answer.plan[0]).toMatchObject({ beat: 'cover', action: 'replace', spreadId: created?.spread_ids[0] });
    expect(answer.plan.some((row) => row.beat === 'back')).toBe(true);
    expect(answer.plan.some((row) => row.action === 'insert')).toBe(true);
    expect(answer.selected).toEqual(changing(answer));
    expect(answer.style.style).toBe('classic');
    expect(Date.parse(answer.expires_at)).toBeGreaterThan(Date.now());
    expect(await version(journey.id, editor.id)).toBe(created?.version);
    expect(told()).toEqual([]);
    expect(await designs.describeDraft(journey.id, editor.id, answer.design_id)).toEqual(answer);
  });

  it("JBDSN-002: only the owner and editors design or apply; a draft is its maker's alone, gone for others", async () => {
    const { journey, owner, viewer, stranger } = await crew();
    expect(await refusal(() => designs.design(journey.id, viewer.id))).toEqual({ status: 403, code: 'book_read_only' });
    expect(await refusal(() => designs.design(journey.id, stranger.id))).toMatchObject({ status: 404 });

    const answer = await designs.design(journey.id, owner.id, { style: 'minimal', density: 'airy' });

    expect(answer.style.style).toBe('minimal');
    const gone = { status: 410, code: 'book_design_expired' };
    const id = answer.design_id;
    expect(await refusal(() => designs.draftView(journey.id, viewer.id, id))).toEqual(gone);
    expect(await refusal(() => designs.describeDraft(journey.id, owner.id, 'd-none'))).toEqual(gone);
    expect(await refusal(() => designs.draftView(journey.id, stranger.id, id))).toMatchObject({ status: 404 });
    expect(await refusal(() => designs.select(journey.id, viewer.id, id, []))).toMatchObject({ status: 403 });
    // Taking the owner's draft is a question of rights first, never answered as a design gone.
    const taking = { designId: id };
    expect(await refusal(() => designs.apply(journey.id, viewer.id, taking))).toEqual({
      status: 403,
      code: 'book_read_only',
    });
    expect(await refusal(() => designs.apply(journey.id, stranger.id, taking))).toMatchObject({ status: 404 });
  });

  it('JBDSN-003: a revision changes a page of the draft like an edit would, nothing of the book; a kept page revised is proposed', async () => {
    const { journey, owner, created } = await crew();
    const inner = created?.spread_ids[2] ?? '';
    const heading = [{ op: 'text' as const, role: 'heading' as const, text: 'Mine' }];
    await edit.editPage(journey.id, owner.id, { spreadId: inner, ops: heading });
    const mine = (await edit.describePage(journey.id, owner.id, inner)).elements[0]?.id ?? '';
    const lock = [{ op: 'lock' as const, elementIds: [mine], locked: true }];
    const locked = await edit.editPage(journey.id, owner.id, { spreadId: inner, ops: lock });
    const answer = await designs.design(journey.id, owner.id);
    const target = answer.plan.find((row) => row.action === 'insert')?.spreadId ?? '';
    expect(answer.plan.find((row) => row.spreadId === inner)?.action).toBe('keep');

    const background = [{ op: 'background' as const, color: '#f4efe6' }];
    const onTarget = { designId: answer.design_id, spreadId: target, ops: background };
    const revised = await designs.revise(journey.id, owner.id, onTarget);

    expect([revised.page.id, revised.page.background]).toEqual([target, '#f4efe6']);
    const draft = await designs.draftView(journey.id, owner.id, answer.design_id);
    expect(draft.document.spreads.find((s) => s.id === target)?.background).toBe('#f4efe6');
    expect(await version(journey.id, owner.id)).toBe(locked.version);
    const foreign = [{ op: 'place_photo' as const, photoId: 999_999, target: 'new' as const }];
    const refused = { designId: answer.design_id, spreadId: target, ops: foreign };
    expect(await refusal(() => designs.revise(journey.id, owner.id, refused))).toEqual({
      status: 422,
      code: 'book_photo_not_in_gallery',
    });

    const onKept = { designId: answer.design_id, spreadId: inner, ops: background };
    const turned = await designs.revise(journey.id, owner.id, onKept);
    expect(turned.action).toBe('replace');
    expect((await designs.describeDraft(journey.id, owner.id, answer.design_id)).selected).toContain(inner);
  });

  it('JBDSN-004: the selection names only pages the plan changes, and the draft reads it back', async () => {
    const { journey, owner } = await crew();
    const answer = await designs.design(journey.id, owner.id);
    const first = changing(answer)[0] ?? '';

    const chosen = await designs.select(journey.id, owner.id, answer.design_id, [first, first]);
    expect(chosen).toEqual({ selection: [first] });
    expect((await designs.describeDraft(journey.id, owner.id, answer.design_id)).selected).toEqual([first]);
    expect((await designs.draftView(journey.id, owner.id, answer.design_id)).selection).toEqual([first]);
    expect(await refusal(() => designs.select(journey.id, owner.id, answer.design_id, ['sp-nowhere']))).toEqual({
      status: 422,
      code: 'book_design_page_unknown',
    });
  });
});

describe('applying a design', () => {
  it('JBDSN-005: the chosen pages land in one version, every member is told once, and the book as it was is kept', async () => {
    const { journey, editor, created, everyone } = await crew();
    const answer = await designs.design(journey.id, editor.id);

    const result = await designs.apply(journey.id, editor.id, { designId: answer.design_id });

    const applied = bookDesignApplyResultSchema.parse(result);
    expect(applied.version).toBe((created?.version ?? 0) + 1);
    expect(applied.applied).toEqual(changing(answer));
    expect(applied.skipped).toEqual(dropping(answer));
    expect(applied.spread_ids).toEqual(expect.arrayContaining(applied.applied.slice(0, 1)));
    expect(told()).toEqual(everyone);
    const revision = await findRow(orm, JourneyBookRevisions, { id: applied.revision_id ?? 0 });
    expect(revision?.version).toBe(created?.version);
    const kept = JSON.parse(revision?.document ?? '{}') as { spreads: Array<{ id: string }> };
    expect(kept.spreads.map((s) => s.id)).toEqual(created?.spread_ids);
    const stored = await t.get(JourneyBookService).getBook(journey.id, editor.id);
    expect(stored?.document.spreads.map((s) => s.id)).toEqual(expect.arrayContaining(changing(answer)));
    const again = { designId: answer.design_id };
    expect(await refusal(() => designs.apply(journey.id, editor.id, again))).toMatchObject({ status: 410 });
  });

  it('JBDSN-006: a page saved since stays and is named; nothing left to apply and a stale version are 409, nothing written', async () => {
    const { journey, owner, created } = await crew();
    const cover = created?.spread_ids[0] ?? '';
    const first = await designs.design(journey.id, owner.id);
    await edit.setCover(journey.id, owner.id, { title: 'Saved in the Studio' });

    const applied = await designs.apply(journey.id, owner.id, { designId: first.design_id });
    expect(applied.skipped).toContainEqual({ spreadId: cover, reason: 'changed_since' });
    expect(applied.applied).not.toContain(cover);

    const second = await designs.design(journey.id, owner.id);
    await designs.select(journey.id, owner.id, second.design_id, [cover]);
    await edit.setCover(journey.id, owner.id, { title: 'Saved again' });
    const before = await version(journey.id, owner.id);
    const revisions = await countRows(orm, JourneyBookRevisions);
    t.realtime.reset();
    expect(await refusal(() => designs.apply(journey.id, owner.id, { designId: second.design_id }))).toEqual({
      status: 409,
      code: 'book_design_nothing_applied',
    });
    const stale = { designId: second.design_id, expectedVersion: 1 };
    expect(await refusal(() => designs.apply(journey.id, owner.id, stale))).toMatchObject({ status: 409 });
    expect(await version(journey.id, owner.id)).toBe(before);
    expect(await countRows(orm, JourneyBookRevisions)).toBe(revisions);
    expect(told()).toEqual([]);
  });

  it('JBDSN-007: a journey without a book gets the design as a new book, with no revision to go back to', async () => {
    const { journey, owner } = await crew({ withBook: false });

    const answer = await designs.design(journey.id, owner.id);
    expect(answer.base_version).toBeNull();
    expect(answer.plan.every((row) => row.action === 'insert')).toBe(true);
    const applied = await designs.apply(journey.id, owner.id, { designId: answer.design_id });

    expect([applied.version, applied.revision_id]).toEqual([1, null]);
    expect((await edit.overview(journey.id, owner.id)).spreads[0]?.role).toBe('cover');
  });
});

describe('taking a design back', () => {
  it('JBDSN-008: the revision puts the book back as the apply found it, only at the version the apply left', async () => {
    const { journey, owner, viewer, created } = await crew();
    const answer = await designs.design(journey.id, owner.id);
    const applied = await designs.apply(journey.id, owner.id, { designId: answer.design_id });
    const revisionId = applied.revision_id ?? 0;
    const back = { revisionId, expectedVersion: applied.version };

    expect(await refusal(() => designs.restoreRevision(journey.id, viewer.id, back))).toMatchObject({ status: 403 });
    const stale = { revisionId, expectedVersion: 1 };
    expect(await refusal(() => designs.restoreRevision(journey.id, owner.id, stale))).toMatchObject({ status: 409 });
    const missing = { revisionId: revisionId + 1000, expectedVersion: applied.version };
    expect(await refusal(() => designs.restoreRevision(journey.id, owner.id, missing))).toEqual({
      status: 404,
      code: 'book_revision_missing',
    });

    const restored = await designs.restoreRevision(journey.id, owner.id, back);

    expect(restored.version).toBe(applied.version + 1);
    expect(restored.spread_ids).toEqual(created?.spread_ids);
    expect((await edit.overview(journey.id, owner.id)).spreads.map((s) => s.id)).toEqual(created?.spread_ids);
  });

  it('JBDSN-010: a revision that does not read back is refused, and the book is not written over with an empty one', async () => {
    const { journey, owner } = await crew();
    const answer = await designs.design(journey.id, owner.id);
    const applied = await designs.apply(journey.id, owner.id, { designId: answer.design_id });
    const revisionId = applied.revision_id ?? 0;
    await updateRows(orm, JourneyBookRevisions, { id: revisionId }, { document: 'not json' });
    t.realtime.reset();

    const back = { revisionId, expectedVersion: applied.version };
    expect(await refusal(() => designs.restoreRevision(journey.id, owner.id, back))).toEqual({
      status: 409,
      code: 'book_revision_unreadable',
    });
    expect(await version(journey.id, owner.id)).toBe(applied.version);
    expect(told()).toEqual([]);
  });

  it('JBDSN-011: a revision kept by a newer TREK is refused, never put back stripped of what this one cannot read', async () => {
    const { journey, owner } = await crew();
    const answer = await designs.design(journey.id, owner.id);
    const applied = await designs.apply(journey.id, owner.id, { designId: answer.design_id });
    const revisionId = applied.revision_id ?? 0;
    const kept = await findRow(orm, JourneyBookRevisions, { id: revisionId });
    const newer = JSON.stringify({ ...JSON.parse(String(kept?.document)), schemaRev: BOOK_SCHEMA_REV + 1 });
    await updateRows(orm, JourneyBookRevisions, { id: revisionId }, { document: newer });
    t.realtime.reset();

    const back = { revisionId, expectedVersion: applied.version };
    expect(await refusal(() => designs.restoreRevision(journey.id, owner.id, back))).toEqual({
      status: 409,
      code: 'book_schema_newer',
    });
    expect(await version(journey.id, owner.id)).toBe(applied.version);
    expect(told()).toEqual([]);
  });

  it('JBDSN-009: a journey keeps its newest five revisions', async () => {
    const { journey, owner } = await crew();
    const books = t.get(JourneyBookService);
    const rewrite = (title: string) =>
      books.editBook(
        journey.id,
        owner.id,
        (current) => {
          if (!current) throw new Error('the journey has a book');
          return { title, document: current.document, result: null };
        },
        { keepRevision: true },
      );
    const kept = await ['a', 'b', 'c', 'd', 'e', 'f', 'g'].reduce<Promise<Array<number | null>>>(
      async (ids, title) => [...(await ids), (await rewrite(title)).revisionId],
      Promise.resolve([]),
    );

    expect(kept.every((id) => typeof id === 'number')).toBe(true);
    expect(await countRows(orm, JourneyBookRevisions, { journey: journey.id })).toBe(5);
    expect(await findRow(orm, JourneyBookRevisions, { id: kept[0] ?? 0 })).toBeNull();
  });
});

describe('the art direction', () => {
  it('JBDSN-012: design_book composes the archetype cover and decorates from the theme motifs of the library', async () => {
    const { journey, owner } = await crew();
    const directives = { brief: { energy: 'loud' as const, decoration: 'rich' as const, theme: 'tropical' as const } };
    const answer = await designs.design(journey.id, owner.id, { ...directives, cover: { archetype: 'poster-pop' } });

    expect(answer.style.style).toBe('tropical');
    const { document } = await designs.draftView(journey.id, owner.id, answer.design_id);
    expect(document.theme?.id).toBe('tropical');
    const cover = document.spreads[0];
    expect(cover?.elements.some((e) => e.kind === 'shape' && e.shape === 'sunburst-24')).toBe(true);
    const tropical = new Set(BOOK_STICKERS.filter((s) => s.theme === 'tropical').map((s) => s.id));
    const stickers = document.spreads.flatMap((s) => s.elements).flatMap((e) => (e.kind === 'sticker' ? [e] : []));
    expect(stickers.length).toBeGreaterThanOrEqual(3);
    expect(stickers.every((s) => tropical.has(s.stickerId))).toBe(true);
    expect(answer.findings.filter((f) => f.severity === 'severe')).toEqual([]);
  });

  it('JBDSN-013: a revised page of a design made with a brief is judged against it; one made without is not', async () => {
    const { journey, owner } = await crew();
    const framing = new Set(['cover', 'first', 'closing', 'last', 'back']);
    const photoPage = (answer: BookDesignAnswer) =>
      answer.plan.find((row) => row.photoIds.length > 0 && !framing.has(row.beat))?.spreadId ?? '';
    const sticker = [
      { op: 'add' as const, element: { kind: 'sticker' as const, stickerId: BOOK_STICKERS[0]?.id ?? '' } },
    ];
    // Decoration none: a sticker on a photo page is more than the brief asked for.
    const bare = await designs.design(journey.id, owner.id, { brief: { decoration: 'none' } });
    const page = photoPage(bare);
    expect(page).not.toBe('');
    const revised = await designs.revise(journey.id, owner.id, {
      designId: bare.design_id,
      spreadId: page,
      ops: sticker,
    });
    expect(revised.findings).toContainEqual(expect.objectContaining({ code: 'energy_mismatch', severity: 'info' }));
    const plain = await designs.design(journey.id, owner.id, {});
    const free = await designs.revise(journey.id, owner.id, {
      designId: plain.design_id,
      spreadId: photoPage(plain),
      ops: sticker,
    });
    expect(free.findings.map((f) => f.code)).not.toContain('energy_mismatch');
  });
});
