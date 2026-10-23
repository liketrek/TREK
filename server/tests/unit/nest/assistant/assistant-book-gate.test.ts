/**
 * ASTBGATE-001 to ASTBGATE-008
 *
 * The book check of a Studio turn: a held book write is tried on the stored
 * book before the user sees it; what the engine refuses goes back to the
 * model at once, every time, and a change that would leave new severe faults
 * goes back once a turn per tool and page with its findings, after which the
 * same call is held. Filling some of a page's empty frames and new pages laid
 * out on a template are not new faults. The book is read once per turn and every call tried once,
 * whether the gate or its change card asks first. A book that cannot be read,
 * or a fault in the engine, holds every call as it is.
 */
import { AssistantBookGate, bounceText, openGate } from '../../../../src/nest/assistant/assistant-book-gate';
import { BOOK_TRIAL_READ } from '../../../../src/nest/assistant/cards/book/book-trial';
import type { JourneyBookEditService } from '../../../../src/nest/journey/journey-book-edit.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import {
  addBookPages,
  applyBookOps,
  blankBook,
  type BookDocument,
  type BookEditResult,
  type BookFinding,
} from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => vi.clearAllMocks());

/** sp-1 the cover, sp-2 the first page, sp-3 the double page, sp-4 the last page, sp-5 the back. */
function base() {
  let seq = 0;
  const doc = blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
  return { doc, version: 6, ctx: { photos: [{ photoId: 81 }], journey: { title: 'Lisbon' } } };
}

/** The base book changed by the engine; a change it refuses stops the test. */
function changed(make: (doc: BookDocument) => BookEditResult) {
  const found = base();
  const made = make(found.doc);
  if (made.ok === false) throw new Error(`the fixture was refused: ${made.error.message}`);
  return { found: { ...found, doc: made.doc }, spreadIds: made.spreadIds };
}

/** A gate over a book service that reads `found`, or fails when `found` is an error. */
function gateOver(found: ReturnType<typeof base> | Error = base()) {
  const books = {
    trialBase: vi.fn(async () => {
      if (found instanceof Error) throw found;
      return found;
    }),
  };
  const session = {
    read: vi.fn(async (name: string) => ({ ok: true, value: { from: name } })),
    hintOf: vi.fn(() => null),
  };
  const gate = new AssistantBookGate(books as unknown as JourneyBookEditService, t.orm);
  return { books, session, turn: () => gate.forTurn(7, 4, session) };
}

const EMPTY_FRAMES = { spreadId: 'sp-3', ops: [{ op: 'layout', template: 'two-up' }] };
const OUTSIDE = { spreadId: 'sp-3', ops: [{ op: 'place_photo', photoId: 999, target: 'new' }] };

describe('the book check of a Studio turn', () => {
  it('ASTBGATE-001: what the engine refuses goes back at once, every time; other tools and clean changes pass', async () => {
    const { turn } = gateOver();
    const gate = turn();
    expect(await gate.refusalOf('edit_book_page', OUTSIDE)).toMatch(/^ops\[0\]: /);
    expect(await gate.refusalOf('edit_book_page', OUTSIDE)).toMatch(/^ops\[0\]: /);
    expect(await gate.refusalOf('delete_book_pages', { spreadIds: ['sp-1'] })).toContain('cannot be deleted');
    expect(await gate.refusalOf('create_book', {})).toContain('has a book already');
    expect(await gate.refusalOf('update_journey_entry', { entryId: 3 })).toBeNull();
    const place = { op: 'place_photo', photoId: 81, target: 'new' };
    expect(await gate.refusalOf('edit_book_page', { spreadId: 'sp-3', ops: [place] })).toBeNull();
  });

  it('ASTBGATE-002: new faults go back once per page and turn; the same call made again is held', async () => {
    const newId = (prefix: string) => `${prefix}-x`;
    const { found, spreadIds } = changed((doc) => addBookPages(doc, { afterSpreadId: 'sp-3' }, { newId }));
    const { turn } = gateOver(found);
    const gate = turn();
    const first = await gate.refusalOf('edit_book_page', EMPTY_FRAMES);
    expect(first).toContain('Not proposed yet');
    expect(first).toContain('- empty_frame: ');
    expect(await gate.refusalOf('edit_book_page', EMPTY_FRAMES)).toBeNull();
    // Another page has a bounce of its own.
    const other = { ...EMPTY_FRAMES, spreadId: spreadIds[0] };
    expect(await gate.refusalOf('edit_book_page', other)).toContain('empty_frame');
    expect(await gate.refusalOf('edit_book_page', other)).toBeNull();
    // A new turn checks afresh.
    expect(await turn().refusalOf('edit_book_page', EMPTY_FRAMES)).toContain('Not proposed yet');
  });

  it('ASTBGATE-003: the book is read once a turn and each call tried once, for the gate and its card alike', async () => {
    const { turn, books, session } = gateOver();
    const gate = turn();
    await gate.refusalOf('edit_book_page', EMPTY_FRAMES);
    const run = await gate.reader.read(BOOK_TRIAL_READ, { tool: 'edit_book_page', args: EMPTY_FRAMES });
    expect(run).toMatchObject({
      ok: true,
      value: { ok: true, journeyId: 4, version: 6, before: [{ spreadId: 'sp-3' }] },
    });
    const again = await gate.reader.read(BOOK_TRIAL_READ, { tool: 'edit_book_page', args: EMPTY_FRAMES });
    expect(again.value).toBe(run.value);
    await gate.refusalOf('edit_book_page', OUTSIDE);
    expect(books.trialBase).toHaveBeenCalledTimes(1);
    expect(books.trialBase).toHaveBeenCalledWith(4, 7);
    // Every other read is the session's own.
    expect(await gate.reader.read('get_book', {})).toEqual({ ok: true, value: { from: 'get_book' } });
    expect(session.read).toHaveBeenCalledWith('get_book', {});
    gate.reader.hintOf('get_book');
    expect(session.hintOf).toHaveBeenCalledWith('get_book');
    expect(await gate.reader.read(BOOK_TRIAL_READ, { tool: 'get_book', args: {} })).toMatchObject({ ok: false });
  });

  it('ASTBGATE-004: a book that cannot be read holds every call as it is, and says so in the log', async () => {
    const { turn } = gateOver(new Error('Journey not found'));
    const gate = turn();
    expect(await gate.refusalOf('edit_book_page', EMPTY_FRAMES)).toBeNull();
    expect(await gate.reader.read(BOOK_TRIAL_READ, { tool: 'edit_book_page', args: EMPTY_FRAMES })).toMatchObject({
      ok: false,
    });
    expect(logMock.logWarn).toHaveBeenCalledWith(expect.stringContaining('Journey not found'));
  });

  it('ASTBGATE-008: a fault in the engine holds the call as it is, and says so in the log', async () => {
    const found = base();
    // The gallery fails as the engine reads it: a plain fault, not a refusal of the change.
    const broken = {
      ...found,
      ctx: {
        journey: found.ctx.journey,
        get photos(): never {
          throw new Error('the gallery is gone');
        },
      },
    };
    const { turn } = gateOver(broken);
    const gate = turn();
    expect(await gate.refusalOf('edit_book_page', EMPTY_FRAMES)).toBeNull();
    expect(await gate.reader.read(BOOK_TRIAL_READ, { tool: 'edit_book_page', args: EMPTY_FRAMES })).toMatchObject({
      ok: false,
    });
    expect(logMock.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('the trial of edit_book_page failed: the gallery is gone'),
    );
  });

  it("ASTBGATE-005: a trip conversation's gate sends nothing back and its cards read the session itself", async () => {
    const { session } = gateOver();
    const gate = openGate(session);
    expect(await gate.refusalOf('edit_book_page', EMPTY_FRAMES)).toBeNull();
    expect(gate.reader).toBe(session);
  });

  it('ASTBGATE-007: filling some empty frames and new pages on a template are held; their findings stay on the card', async () => {
    const { found } = changed((doc) => applyBookOps(doc, EMPTY_FRAMES));
    const { turn } = gateOver(found);
    const gate = turn();
    // One of the two frames filled: the other is still empty, which is no new fault.
    const fill = { spreadId: 'sp-3', ops: [{ op: 'place_photo', photoId: 81, target: { slot: 0 } }] };
    expect(await gate.refusalOf('edit_book_page', fill)).toBeNull();
    // A new page's template brings its frames empty; this tool cannot fill them, so nothing goes back.
    const added = { afterSpreadId: 'sp-3', template: 'two-up' };
    expect(await gate.refusalOf('add_book_pages', added)).toBeNull();
    const card = await gate.reader.read(BOOK_TRIAL_READ, { tool: 'add_book_pages', args: added });
    expect(card).toMatchObject({ ok: true, value: { fresh: [] } });
    const findings = (card.value as { findings: BookFinding[] }).findings;
    expect(findings.map((finding) => finding.code)).toContain('empty_frame');
  });

  it('ASTBGATE-006: the bounce names at most six findings, one a line, and counts the rest', () => {
    const finding = (n: number): BookFinding => ({
      code: 'overlap',
      severity: 'severe',
      elementIds: [`p-${n}`],
      message: `photos ${n} overlap`,
    });
    const text = bounceText(Array.from({ length: 8 }, (_, n) => finding(n)));
    const lines = text.split('\n');
    expect(lines).toHaveLength(8);
    expect(lines[1]).toBe('- overlap: photos 0 overlap');
    expect(lines[7]).toBe('- and 2 more');
  });
});
