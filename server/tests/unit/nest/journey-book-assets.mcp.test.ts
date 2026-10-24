/**
 * list_book_assets (JBASSET-*): the Studio's catalogues searched through
 * JourneyBookMcp, the sticker library and the shapes, faces, lockups, themes
 * and patterns beside it, and a sticker placed with
 * edit_book_page from the library the edit context hands the engine. Taken
 * from JourneyBookModule over a snapshot test db.
 *
 * What it pins: the tool waits for the Journey addon, only reads and sits in
 * the journey group; any member may search, an outsider is told the journey
 * is not there; the answer is the catalogue's rows with their slots; a
 * sticker the library holds lands on the page in its proportions, one it does
 * not hold is refused with the engine's code and nothing is written.
 */
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { JourneyBookMcp } from '../../../src/nest/journey/journey-book.mcp';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../helpers/factories/journeys';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { bookOverviewSchema, bookWriteResultSchema, type ListBookAssetsRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyBookMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyBookModule] });
  mcp = t.get(JourneyBookMcp);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;
const json = (result: { content: Array<{ type: string; text: string }> }) => JSON.parse(result.content[0]?.text ?? '');

/** A journey with a blank book, and the id of its one double spread. */
async function bookFor(ownerId: number) {
  const journey = await makeJourney(orm, ownerId);
  await mcp.createBook({ journeyId: journey.id }, ctx(ownerId));
  const overview = bookOverviewSchema.parse(json(await mcp.getBook({ journeyId: journey.id }, ctx(ownerId))));
  const inner = overview.spreads.find((s) => s.role === 'inner')?.id ?? '';
  return { journey, inner };
}

describe('list_book_assets', () => {
  it('JBASSET-001: waits for the Journey addon, reads only, in the journey group', async () => {
    const { user } = await makeUser(orm);
    const entry = getEntry(JourneyBookMcp as unknown as ClassRef, 'listAssets');
    if (entry?.kind !== 'tool') throw new Error('listAssets is no tool');
    expect(entry.options.name).toBe('list_book_assets');
    expect(entry.options.access).toEqual({ group: 'journey', mode: 'read' });
    expect(entry.options.annotations?.readOnlyHint).toBe(true);
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled');
    enabled.mockResolvedValue(false);
    expect(await entry.options.when?.(ctx(user.id), mcp)).toBe(false);
    enabled.mockResolvedValue(true);
    expect(await entry.options.when?.(ctx(user.id), mcp)).toBe(true);
  });

  it('JBASSET-002: any member searches the library, an outsider is told the journey is not there', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: viewer } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');

    const answer = json(
      await mcp.listAssets({ journeyId: journey.id, kind: 'sticker', query: 'lemon', limit: 3 }, ctx(viewer.id)),
    );
    expect(answer.kind).toBe('sticker');
    expect(answer.rows).toHaveLength(3);
    expect(answer.rows[0]).toMatchObject({ id: 'lemon', theme: 'mediterranean', aspect: 1.25 });
    expect(answer.rows[0].slots).toEqual([
      { name: 'lemon', default: '#ffd23f' },
      { name: 'leaves', default: '#3f8f4f' },
    ]);
    expect(answer.total).toBeGreaterThanOrEqual(3);

    const paper = json(await mcp.listAssets({ journeyId: journey.id, kind: 'sticker', theme: 'paper' }, ctx(owner.id)));
    expect(paper.rows.every((row: { theme: string }) => row.theme === 'paper')).toBe(true);
    await expect(mcp.listAssets({ journeyId: journey.id, kind: 'sticker' }, ctx(stranger.id))).rejects.toThrow(
      'Journey not found',
    );
  });

  it('JBASSET-005: lists the shapes, faces, lockups, themes and patterns too, each row an id, a line and its tags', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    const list = async (args: ListBookAssetsRequest) =>
      json(await mcp.listAssets({ journeyId: journey.id, ...args }, ctx(owner.id)));

    const arches = await list({ kind: 'shape', query: 'arch', limit: 3 });
    expect(arches).toMatchObject({ kind: 'shape', rows: [{ id: 'arch' }, {}, {}] });
    expect(arches.total).toBeGreaterThan(3);
    expect(arches.rows[0]).toMatchObject({ frame: true, edges: true, tags: expect.arrayContaining(['basic']) });
    const scripts = await list({ kind: 'font', tags: ['script'] });
    expect(scripts.rows.length).toBeGreaterThanOrEqual(10);
    expect(scripts.rows.every((r: { tags: string[] }) => r.tags.includes('script'))).toBe(true);
    const badge = await list({ kind: 'lockup', query: 'postmark' });
    expect(badge.rows[0]).toMatchObject({ id: 'postmark', words: expect.arrayContaining(['place', 'dates']) });
    const themes = await list({ kind: 'theme', query: 'tropical' });
    const tropical = themes.rows.find((r: { id: string }) => r.id === 'tropical');
    expect(tropical).toMatchObject({ palette: { paper: expect.any(String) }, fonts: { display: expect.any(String) } });
    const patterns = await list({ kind: 'pattern' });
    expect(patterns.rows.map((r: { id: string }) => r.id)).toContain('gingham');
    // A theme narrows stickers only; the other kinds pay it no heed.
    expect((await list({ kind: 'pattern', theme: 'paper' })).total).toBe(patterns.total);
  });

  it('JBASSET-006: says what each kind lists, and that templates are list_book_layouts', () => {
    const entry = getEntry(JourneyBookMcp as unknown as ClassRef, 'listAssets');
    if (entry?.kind !== 'tool') throw new Error('listAssets is no tool');
    const description = entry.options.description ?? '';
    for (const kind of ['kind sticker', 'kind shape', 'kind font', 'kind lockup', 'kind theme', 'kind pattern']) {
      expect(description).toContain(kind);
    }
    expect(description).toContain("Templates are list_book_layouts'");
    expect(description).not.toMatch(/[\u2013\u2014]/);
  });
});

describe('a sticker on a page', () => {
  it('JBASSET-003: edit_book_page places a sticker the library holds, in its proportions and the colours asked for', async () => {
    const { user: owner } = await makeUser(orm);
    const { journey, inner } = await bookFor(owner.id);
    const element = { kind: 'sticker' as const, stickerId: 'eiffelTower' };
    // The look follows the add in the same call, by the id the add gave it.
    const colours = { kind: 'sticker' as const, colors: ['#1d3557'] };
    const ops = [
      { op: 'add' as const, element, id: 'tower' },
      { op: 'style' as const, elementId: 'tower', set: colours },
    ];
    const written = bookWriteResultSchema.parse(
      json(await mcp.editBookPage({ journeyId: journey.id, spreadId: inner, ops }, ctx(owner.id))),
    );
    expect(written.spread_ids).toEqual([inner]);
    const page = json(await mcp.describeBookPage({ journeyId: journey.id, spreadId: inner }, ctx(owner.id)));
    const sticker = page.elements.find((e: { kind: string }) => e.kind === 'sticker');
    // The tower is drawn 70 by 100: on the 21 cm page it stands 63 mm tall and 44.1 mm wide.
    expect(sticker?.frame).toMatchObject({ w: 44.1, h: 63 });
    expect(page.text).toMatch(/sticker eiffelTower, colours #1d3557/);
  });

  it('JBASSET-004: a sticker the library does not hold is refused with the engine code, and nothing is written', async () => {
    const { user: owner } = await makeUser(orm);
    const { journey, inner } = await bookFor(owner.id);
    const before = json(await mcp.getBook({ journeyId: journey.id }, ctx(owner.id))).version;
    const element = { kind: 'sticker' as const, stickerId: 'unicornCastle' };
    await expect(
      mcp.editBookPage({ journeyId: journey.id, spreadId: inner, ops: [{ op: 'add', element }] }, ctx(owner.id)),
    ).rejects.toThrow(/no sticker unicornCastle/);
    expect(json(await mcp.getBook({ journeyId: journey.id }, ctx(owner.id))).version).toBe(before);
  });
});
