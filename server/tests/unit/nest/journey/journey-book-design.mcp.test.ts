/**
 * The whole-book design tools and the book-level tools over MCP (JBDMCP-*):
 * JourneyBookDesignMcp and the new tools of JourneyBookMcp, taken from
 * JourneyBookDesignModule over a snapshot test db.
 *
 * What it pins: every tool waits for the Journey addon and works in the
 * journey group, the design, its read and its revision as reads, the apply,
 * the undo targets and the book-level changes as writes; the tools answer
 * what the services answer, so an editor designs, revises and applies, a
 * viewer is refused every change and an outsider told the journey is not
 * there by every tool, before a draft is looked for (403 or 404, not 410);
 * the apply tells every member once, the asking one included;
 * describe_book_page reads a draft page by its designId.
 */
import { JourneyEntryPhotos } from '../../../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import type { McpContext } from '../../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { JourneyBookDesignMcp } from '../../../../src/nest/journey/journey-book-design.mcp';
import { JourneyBookDesignModule } from '../../../../src/nest/journey/journey-book-design.module';
import { JourneyBookMcp } from '../../../../src/nest/journey/journey-book.mcp';
import { PhotoResolverService } from '../../../../src/nest/memories/photo-resolver.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../../helpers/factories/journeys';
import { insertRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import {
  bookDesignAnswerSchema,
  bookDesignApplyResultSchema,
  bookDesignRevisionAnswerSchema,
  bookPageDescriptionSchema,
  bookWriteResultSchema,
} from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let designs: JourneyBookDesignMcp;
let books: JourneyBookMcp;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyBookDesignModule],
    overrides: [{ provide: PhotoResolverService, useValue: { readForSignals: async () => ({ kind: 'none' }) } }],
  });
  designs = t.get(JourneyBookDesignMcp);
  books = t.get(JourneyBookMcp);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  t.realtime.reset();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

/** The JSON a tool answered with. */
function answered(result: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(result.content[0]?.text ?? '');
}

/** A journey with an entry and its photo, a book, an editor, a viewer and someone outside it. */
async function crew() {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Lisbon' });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  const entry = await makeJourneyEntry(orm, journey.id, owner.id, { title: 'Alfama', story: 'Trams and tiles.' });
  const photo = await insertRow(orm, TrekPhotos, { provider: 'local', owner: owner.id, file_path: 'journey/p.jpg' });
  const galleryId = await insertRow(orm, JourneyPhotos, {
    journey: journey.id,
    photo,
    sort_order: 0,
    created_at: Date.now(),
  });
  await insertRow(orm, JourneyEntryPhotos, { entry: entry.id, journeyPhoto: galleryId, created_at: Date.now() });
  await books.createBook({ journeyId: journey.id }, ctx(owner.id));
  t.realtime.reset();
  const everyone = [owner.id, editor.id, viewer.id].sort((a, b) => a - b);
  return { owner, editor, viewer, stranger, journey, everyone };
}

const TOOLS: Array<[ClassRef, string, string, 'read' | 'write']> = [
  [JourneyBookDesignMcp as unknown as ClassRef, 'designBook', 'design_book', 'read'],
  [JourneyBookDesignMcp as unknown as ClassRef, 'getBookDesign', 'get_book_design', 'read'],
  [JourneyBookDesignMcp as unknown as ClassRef, 'reviseBookDesign', 'revise_book_design', 'read'],
  [JourneyBookDesignMcp as unknown as ClassRef, 'applyBookDesign', 'apply_book_design', 'write'],
  [JourneyBookDesignMcp as unknown as ClassRef, 'restoreBookRevision', 'restore_book_revision', 'write'],
  [JourneyBookMcp as unknown as ClassRef, 'setBookSetup', 'set_book_setup', 'write'],
  [JourneyBookMcp as unknown as ClassRef, 'duplicateBookPage', 'duplicate_book_page', 'write'],
  [JourneyBookMcp as unknown as ClassRef, 'saveBookLayout', 'save_book_layout', 'write'],
  [JourneyBookMcp as unknown as ClassRef, 'removeBookLayout', 'remove_book_layout', 'write'],
  [JourneyBookMcp as unknown as ClassRef, 'restoreBookLayout', 'restore_book_layout', 'write'],
];

/** The tool a method of a controller declares. */
function toolOf(cls: ClassRef, method: string) {
  const entry = getEntry(cls, method);
  if (entry?.kind !== 'tool') throw new Error(`${method} is no tool`);
  return entry.options;
}

describe('the design tools', () => {
  it('JBDMCP-001: every tool waits for the Journey addon, in the journey group, reading or writing as it does', async () => {
    const { owner } = await crew();
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled');
    const tools = TOOLS.map(([cls, method]) => toolOf(cls, method));
    expect(tools.map((tool) => [tool.name, tool.access])).toEqual(
      TOOLS.map(([, , name, mode]) => [name, { group: 'journey', mode }]),
    );
    const reads = TOOLS.map(([, , , mode]) => mode === 'read');
    expect(tools.map((tool) => tool.annotations?.readOnlyHint === true)).toEqual(reads);
    expect(tools.filter((tool) => /[\u2013\u2014]/.test(tool.description ?? ''))).toEqual([]);
    const gate = () => Promise.all(tools.map((tool) => tool.when?.(ctx(owner.id), designs)));
    enabled.mockResolvedValue(false);
    expect(await gate()).toEqual(tools.map(() => false));
    enabled.mockResolvedValue(true);
    expect(await gate()).toEqual(tools.map(() => true));
  });

  it('JBDMCP-002: an editor designs, reads, revises and applies; every member is told once, the asking one included', async () => {
    const { journey, editor, everyone } = await crew();

    const designed = await designs.designBook({ journeyId: journey.id }, ctx(editor.id));
    const draft = bookDesignAnswerSchema.parse(answered(designed));
    const designId = draft.design_id;
    const again = answered(await designs.getBookDesign({ journeyId: journey.id, designId }, ctx(editor.id)));
    expect(again).toEqual(draft);
    const spreadId = draft.plan.find((row) => row.action === 'insert')?.spreadId ?? '';
    const ops = [{ op: 'background' as const, color: '#f4efe6' }];
    const revised = await designs.reviseBookDesign({ journeyId: journey.id, designId, spreadId, ops }, ctx(editor.id));
    expect(bookDesignRevisionAnswerSchema.parse(answered(revised)).page.background).toBe('#f4efe6');
    const page = await books.describeBookPage({ journeyId: journey.id, spreadId, designId }, ctx(editor.id));
    expect(bookPageDescriptionSchema.parse(answered(page)).spreadId).toBe(spreadId);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();

    const applied = await designs.applyBookDesign({ journeyId: journey.id, designId }, ctx(editor.id));

    expect(bookDesignApplyResultSchema.parse(answered(applied)).applied).toContain(spreadId);
    const sent = t.realtime.broadcastToUserMock.mock.calls.map(([to, msg]) => [to, (msg as { type: string }).type]);
    expect(sent.sort((a, b) => Number(a[0]) - Number(b[0]))).toEqual(everyone.map((id) => [id, 'journey:book:saved']));
  });

  it('JBDMCP-003: a viewer is refused the design and the book-level writes, an outsider is told the journey is not there', async () => {
    const { journey, viewer, stranger } = await crew();
    await expect(designs.designBook({ journeyId: journey.id }, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(designs.designBook({ journeyId: journey.id }, ctx(stranger.id))).rejects.toThrow('Journey not found');
    const format = { journeyId: journey.id, preset: 'a4-portrait' as const };
    await expect(books.setBookSetup(format, ctx(viewer.id))).rejects.toThrow('Not allowed');
  });

  it('JBDMCP-004: the book-level tools answer as book writes, with what takes them back', async () => {
    const { journey, owner } = await crew();
    const overview = answered(await books.getBook({ journeyId: journey.id }, ctx(owner.id))) as {
      spreads: Array<{ id: string; role: string }>;
    };
    const inner = overview.spreads.find((s) => s.role === 'inner')?.id ?? '';

    const setup = bookWriteResultSchema.parse(
      answered(await books.setBookSetup({ journeyId: journey.id, safe: 8 }, ctx(owner.id))),
    );
    expect(setup.previous_setup?.safe).toBe(5);
    const copy = bookWriteResultSchema.parse(
      answered(await books.duplicateBookPage({ journeyId: journey.id, spreadId: inner }, ctx(owner.id))),
    );
    expect(copy.spread_ids).toHaveLength(1);
    const saved = bookWriteResultSchema.parse(
      answered(await books.saveBookLayout({ journeyId: journey.id, spreadId: inner }, ctx(owner.id))),
    );
    const layoutId = saved.layout_id ?? '';
    const removed = bookWriteResultSchema.parse(
      answered(await books.removeBookLayout({ journeyId: journey.id, layoutId }, ctx(owner.id))),
    );
    expect(removed.previous_layout?.id).toBe(layoutId);
    const layout = JSON.stringify(removed.previous_layout);
    const back = { journeyId: journey.id, layout, expectedVersion: removed.version };
    const restored = bookWriteResultSchema.parse(answered(await books.restoreBookLayout(back, ctx(owner.id))));
    expect(restored.version).toBe(removed.version + 1);
  });

  it('JBDMCP-005: the other tools refuse an outsider, and a viewer every change, before a draft is read', async () => {
    const { journey, viewer, stranger } = await crew();
    const draft = { journeyId: journey.id, designId: 'd-none' };
    const revise = { ...draft, spreadId: 'sp-none', ops: [{ op: 'background' as const, color: '#f4efe6' }] };
    const revision = { journeyId: journey.id, revisionId: 1, expectedVersion: 1 };
    const page = { journeyId: journey.id, spreadId: 'sp-none' };
    const removal = { journeyId: journey.id, layoutId: 'l-none', expectedVersion: 1 };
    const putBack = { journeyId: journey.id, layout: '{}', expectedVersion: 1 };
    const format = { journeyId: journey.id, preset: 'a4-portrait' as const };
    const gone = 'Journey not found';

    await expect(designs.getBookDesign(draft, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(designs.reviseBookDesign(revise, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(designs.applyBookDesign(draft, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(designs.restoreBookRevision(revision, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(books.duplicateBookPage(page, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(books.saveBookLayout(page, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(books.removeBookLayout(removal, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(books.restoreBookLayout(putBack, ctx(stranger.id))).rejects.toThrow(gone);
    await expect(books.setBookSetup(format, ctx(stranger.id))).rejects.toThrow(gone);

    // A viewer may read the book, so a draft it never made is gone; every change is refused.
    await expect(designs.getBookDesign(draft, ctx(viewer.id))).rejects.toThrow('This design is no longer kept');
    await expect(designs.reviseBookDesign(revise, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(designs.applyBookDesign(draft, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(designs.restoreBookRevision(revision, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(books.duplicateBookPage(page, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(books.saveBookLayout(page, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(books.removeBookLayout(removal, ctx(viewer.id))).rejects.toThrow('Not allowed');
    await expect(books.restoreBookLayout(putBack, ctx(viewer.id))).rejects.toThrow('Not allowed');
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });
});
