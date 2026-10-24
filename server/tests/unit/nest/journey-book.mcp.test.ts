/**
 * JourneyBookMcp: the Studio book over MCP, on JourneyBookEditService and the
 * rights of PUT /api/journeys/:id/book. Taken from JourneyBookModule over a
 * snapshot test db with the realtime fake, so a write's event is the one the
 * app sends.
 *
 * What it pins: every tool waits for the Journey addon and says whether it
 * reads or writes; the owner and an editor write, a viewer is refused and an
 * outsider is told the journey is not there; each write sends exactly one
 * journey:book:saved to every member, the actor among them and no tab left
 * out; and the answers are the shapes @trek/shared describes.
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
import { bookOverviewSchema, bookPageDescriptionSchema, bookWriteResultSchema } from '@trek/shared';

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
  t.realtime.reset();
  vi.restoreAllMocks();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }): unknown {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/** Who was sent what, as [user, event type, left-out socket], in user order. */
const sent = () =>
  t.realtime.broadcastToUserMock.mock.calls
    .map(([to, msg, sid]) => [to, (msg as { type: string }).type, sid] as const)
    .sort((a, b) => a[0] - b[0]);

const READS = ['getBook', 'describeBookPage', 'listLayouts'];
const WRITES = [
  'createBook',
  'addBookPages',
  'moveBookPage',
  'deleteBookPages',
  'editBookPage',
  'setBookCover',
  'restoreBookPage',
];

describe('JourneyBookMcp', () => {
  it('JBMCP-001: every tool waits for the Journey addon and reads or writes in the journey group as it is annotated', async () => {
    const { user } = await makeUser(orm);
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled');
    const tools = [...READS, ...WRITES].map((method) => {
      const entry = getEntry(JourneyBookMcp as unknown as ClassRef, method);
      if (entry?.kind !== 'tool') throw new Error(`${method} is no tool`);
      const reads = READS.includes(method);
      expect(entry.options.access, method).toEqual({ group: 'journey', mode: reads ? 'read' : 'write' });
      expect(entry.options.annotations?.readOnlyHint, method).toBe(reads);
      return entry;
    });
    const gates = () => Promise.all(tools.map((entry) => entry.options.when?.(ctx(user.id), mcp)));
    enabled.mockResolvedValue(false);
    expect(await gates()).toEqual(tools.map(() => false));
    enabled.mockResolvedValue(true);
    expect(await gates()).toEqual(tools.map(() => true));
    const remove = getEntry(JourneyBookMcp as unknown as ClassRef, 'deleteBookPages');
    expect(remove?.kind === 'tool' && remove.options.annotations?.destructiveHint).toBe(true);
  });

  it('JBMCP-002: the owner and an editor write, each write sends one journey:book:saved to every member and skips no tab', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: editor } = await makeUser(orm);
    const { user: viewer } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, editor.id, 'editor');
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
    const everyone = [owner.id, editor.id, viewer.id].sort((a, b) => a - b);
    const once = everyone.map((id) => [id, 'journey:book:saved', undefined] as const);

    const created = bookWriteResultSchema.parse(read(await mcp.createBook({ journeyId: journey.id }, ctx(owner.id))));
    expect(sent()).toEqual(once);
    t.realtime.reset();

    const inner = created.pages.find((p) => p.role === 'inner')?.id ?? 'no inner page';
    const edited = read(
      await mcp.editBookPage(
        { journeyId: journey.id, spreadId: inner, ops: [{ op: 'background', color: '#eeeeee' }] },
        ctx(editor.id),
      ),
    );
    expect(bookWriteResultSchema.parse(edited).version).toBe(2);
    expect(sent()).toEqual(once);
  });

  it('JBMCP-003: a viewer reads but is refused a write, and an outsider is told the journey is not there', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: viewer } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
    const created = bookWriteResultSchema.parse(read(await mcp.createBook({ journeyId: journey.id }, ctx(owner.id))));
    const cover = created.pages[0]?.id ?? 'no cover';
    t.realtime.reset();

    const overview = bookOverviewSchema.parse(read(await mcp.getBook({ journeyId: journey.id }, ctx(viewer.id))));
    expect(overview.spreads).toHaveLength(5);
    const page = read(await mcp.describeBookPage({ journeyId: journey.id, spreadId: cover }, ctx(viewer.id)));
    expect(bookPageDescriptionSchema.parse(page).role).toBe('cover');

    await expect(mcp.setBookCover({ journeyId: journey.id, title: 'Mine' }, ctx(viewer.id))).rejects.toMatchObject({
      status: 403,
    });
    await expect(mcp.getBook({ journeyId: journey.id }, ctx(stranger.id))).rejects.toThrow('Journey not found');
    await expect(mcp.createBook({ journeyId: journey.id }, ctx(stranger.id))).rejects.toThrow('Journey not found');
    expect(sent()).toEqual([]);
  });

  it('JBMCP-004: pages are added, moved, deleted and put back through the tools, each answer in its contract', async () => {
    const { user: owner } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    const as = ctx(owner.id);
    const created = bookWriteResultSchema.parse(read(await mcp.createBook({ journeyId: journey.id }, as)));
    const inner = created.pages[2]?.id ?? 'no inner page';

    const layouts = read(await mcp.listLayouts({ journeyId: journey.id, role: 'inner' }, as)) as { single: unknown[] };
    expect(layouts.single).toEqual([]);
    const added = bookWriteResultSchema.parse(
      read(await mcp.addBookPages({ journeyId: journey.id, afterSpreadId: inner, count: 2 }, as)),
    );
    expect(added.pages.map((p) => p.index)).toEqual([3, 4]);
    const moved = bookWriteResultSchema.parse(
      read(await mcp.moveBookPage({ journeyId: journey.id, spreadId: inner, toIndex: 4 }, as)),
    );
    expect(moved.pages.map((p) => [p.id, p.index])).toEqual([[inner, 4]]);
    expect(moved.from_index).toBe(2);
    const gone = bookWriteResultSchema.parse(
      read(await mcp.deleteBookPages({ journeyId: journey.id, spreadIds: [inner], returnPrevious: true }, as)),
    );
    const previous = gone.previous_spreads?.[0];
    if (!previous) throw new Error('the delete kept no page');

    const back = bookWriteResultSchema.parse(
      read(await mcp.restoreBookPage({ journeyId: journey.id, pages: [previous], expectedVersion: gone.version }, as)),
    );
    expect(back.pages.map((p) => [p.id, p.index])).toEqual([[inner, 4]]);
    expect(back.version).toBe(5);
  });
});
