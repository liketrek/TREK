/**
 * Decorated templates through the book tools (JBTPL-*): list_book_layouts
 * and the layout operation of edit_book_page, run through JourneyBookMcp on
 * JourneyBookModule over a snapshot test db.
 *
 * What it pins: the layouts answer lists the decorated templates of both page
 * kinds with their archetype, tags, photo frames and word roles, and the role
 * narrows it; a cover laid on a decorated template carries the template's
 * design and the book's title, and a spread template on the cover or an id the
 * catalogue does not hold is refused with nothing written.
 */
import type { McpContext } from '../../../src/nest-mcp';
import { JourneyBookMcp } from '../../../src/nest/journey/journey-book.mcp';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../helpers/factories/journeys';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { bookOverviewSchema, bookWriteResultSchema } from '@trek/shared';

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

interface Row {
  id: string;
  archetype: string;
  tags: string[];
  photoSlots: number;
  roles: string[];
}

/** A journey with a blank book, its title, and the ids of its cover and its one double spread. */
async function bookFor(ownerId: number) {
  const journey = await makeJourney(orm, ownerId, { title: 'Azores' });
  await mcp.createBook({ journeyId: journey.id }, ctx(ownerId));
  const overview = bookOverviewSchema.parse(json(await mcp.getBook({ journeyId: journey.id }, ctx(ownerId))));
  const cover = overview.spreads.find((s) => s.role === 'cover')?.id ?? '';
  const inner = overview.spreads.find((s) => s.role === 'inner')?.id ?? '';
  return { journey, cover, inner, version: overview.version };
}

describe('decorated templates in list_book_layouts', () => {
  it('JBTPL-001: lists the decorated covers and spreads to any member, with archetype, tags, frames and roles', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: viewer } = await makeUser(orm);
    const { journey } = await bookFor(owner.id);
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');

    const all = json(await mcp.listLayouts({ journeyId: journey.id }, ctx(viewer.id)));
    const single = all.decorated.single as Row[];
    const inner = all.decorated.inner as Row[];
    expect(single).toHaveLength(21);
    expect(inner).toHaveLength(16);
    expect(new Set(single.map((r) => r.archetype)).size).toBe(7);
    expect(single.find((r) => r.id === 'grid-badge-circle')).toMatchObject({
      archetype: 'grid-badge',
      photoSlots: 4,
      roles: ['subtitle', 'title', 'date'],
    });
    expect(inner.find((r) => r.id === 'polaroid-stack')?.tags).toContain('polaroid');
    expect(all.notes.decorated).toMatch(/whole designed page/);

    const narrowed = json(await mcp.listLayouts({ journeyId: journey.id, role: 'single' }, ctx(owner.id)));
    expect([narrowed.decorated.single.length, narrowed.decorated.inner]).toEqual([21, []]);
  });
});

describe('a page laid out on a decorated template', () => {
  it('JBTPL-002: edit_book_page lays the cover out on a decorated template, in the book title, with its design', async () => {
    const { user: owner } = await makeUser(orm);
    const { journey, cover } = await bookFor(owner.id);
    const written = bookWriteResultSchema.parse(
      json(
        await mcp.editBookPage(
          { journeyId: journey.id, spreadId: cover, ops: [{ op: 'layout', template: 'minimal-serif-classic' }] },
          ctx(owner.id),
        ),
      ),
    );
    expect(written.spread_ids).toEqual([cover]);
    const page = json(await mcp.describeBookPage({ journeyId: journey.id, spreadId: cover }, ctx(owner.id)));
    const kinds = page.elements.map((e: { kind: string }) => e.kind);
    expect(kinds).toEqual(['photo', 'text', 'line']);
    expect(page.elements.find((e: { kind: string }) => e.kind === 'text')?.text).toBe('Azores');
  });

  it('JBTPL-003: refuses a double spread template on the cover, and an id no template has, writing nothing', async () => {
    const { user: owner } = await makeUser(orm);
    const { journey, cover, inner, version } = await bookFor(owner.id);
    await expect(
      mcp.editBookPage(
        { journeyId: journey.id, spreadId: cover, ops: [{ op: 'layout', template: 'polaroid-stack' }] },
        ctx(owner.id),
      ),
    ).rejects.toThrow(/polaroid-stack is a double-spread template/);
    await expect(
      mcp.editBookPage(
        { journeyId: journey.id, spreadId: inner, ops: [{ op: 'layout', template: 'no-such-design' }] },
        ctx(owner.id),
      ),
    ).rejects.toThrow(/no such layout/);
    expect(json(await mcp.getBook({ journeyId: journey.id }, ctx(owner.id))).version).toBe(version);
  });

  it('JBTPL-004: lays a double spread out on a decorated template, the date of its stop kept for its words', async () => {
    const { user: owner } = await makeUser(orm);
    const { journey, inner } = await bookFor(owner.id);
    const written = bookWriteResultSchema.parse(
      json(
        await mcp.editBookPage(
          { journeyId: journey.id, spreadId: inner, ops: [{ op: 'layout', template: 'stamp-row' }] },
          ctx(owner.id),
        ),
      ),
    );
    expect(written.spread_ids).toEqual([inner]);
    const page = json(await mcp.describeBookPage({ journeyId: journey.id, spreadId: inner }, ctx(owner.id)));
    const frames = page.elements.filter((e: { kind: string }) => e.kind === 'photo');
    expect(frames).toHaveLength(4);
    expect(page.elements.some((e: { kind: string }) => e.kind === 'sticker')).toBe(true);
    // The blank page has no words and no entry: the title role is left off rather than set in nothing.
    expect(page.elements.some((e: { kind: string; text?: string }) => e.kind === 'text' && !e.text)).toBe(false);
  });
});
