/**
 * AssistantVision (ASTVSN-*): a Studio turn looking at a page. Images go only
 * when the client draws pages, the model reads images and the user let the
 * connection receive them; only the user's own photos are drawn; no image in
 * time is the description alone; a refused image makes the model text-only,
 * which the connections remember for the process; a decision's turn starts
 * with views of the pages the applied book writes left. The book, the photos
 * and the connections are fakes; the registry is the real in-memory one, the
 * request context a real ORM over a snapshot test db. A proposal goes to the
 * Studio as the page the server applied, with the book context the Studio
 * does not hold.
 */
import type { AiChatMessage } from '../../../../src/nest/ai-connections/ai-chat-client.interface';
import type { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import { modelReadsImages } from '../../../../src/nest/ai-connections/model-catalog.service';
import { InMemoryAssistantRenderRegistry } from '../../../../src/nest/assistant/assistant-render.registry';
import type { AssistantToolSession } from '../../../../src/nest/assistant/assistant-tools.service';
import { AssistantVision, type VisionTurnInput } from '../../../../src/nest/assistant/assistant-vision';
import type { UiStreamWriter } from '../../../../src/nest/assistant/ui-stream.writer';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type { JourneyAiPhotosService } from '../../../../src/nest/journey/journey-ai-photos.service';
import type { JourneyBookEditService } from '../../../../src/nest/journey/journey-book-edit.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import {
  blankBook,
  bookMapElementSchema,
  bookPhotoElementSchema,
  type AssistantPageRender,
  type BookDocument,
} from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});
afterAll(async () => {
  await orm.close();
  testDb.close();
});

const JPEG = Buffer.from('jpeg-bytes');

/** A book whose inner spread holds photo 1 (the user's) and photo 2 (another member's). */
function book(): { doc: BookDocument; inner: string } {
  let n = 0;
  const doc = blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++n}` });
  const inner = doc.spreads[2];
  if (!inner) throw new Error('no inner spread');
  const photo = (id: string, photoId: number, x: number) =>
    bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x, y: 20, w: 120, h: 90 }, photoId });
  doc.spreads[2] = { ...inner, elements: [photo('p-own', 1, 20), photo('p-other', 2, 260)] };
  return { doc, inner: inner.id };
}

interface Fakes {
  acked?: boolean;
  doc?: BookDocument | null;
  /** What the Studio does with a render request: upload the page, or nothing (the turn is stopped instead). */
  upload?: boolean;
}

function setup(fakes: Fakes = {}) {
  const registry = new InMemoryAssistantRenderRegistry();
  const connections = {
    studioImagesAcked: vi.fn(async () => fakes.acked ?? true),
    // What the model's name says; the models refused an image are AiConnectionsService's own (AICS-018).
    readsImages: vi.fn(({ kind, model }: VisionTurnInput['connection']) => modelReadsImages(kind, model)),
    refuseImages: vi.fn(),
  };
  const fixture = book();
  const books = {
    trialBase: vi.fn(async () => ({
      doc: fakes.doc === undefined ? fixture.doc : fakes.doc,
      version: fakes.doc === null ? null : 4,
      ctx: { photos: [{ photoId: 1 }, { photoId: 2 }] },
    })),
  };
  const photos = { ownPhotoIds: vi.fn(async () => new Set([1])) };
  const vision = new AssistantVision(
    connections as unknown as AiConnectionsService,
    books as unknown as JourneyBookEditService,
    photos as unknown as JourneyAiPhotosService,
    registry,
    orm.orm,
  );
  const stop = new AbortController();
  const asked: AssistantPageRender[] = [];
  const w = {
    renderRequest: vi.fn((request: AssistantPageRender) => {
      asked.push(request);
      if (fakes.upload === false) {
        stop.abort();
        return;
      }
      const key = { userId: 7, journeyId: 12, threadId: 4, requestId: request.requestId };
      registry.deliver(key, request, { mimeType: 'image/jpeg', data: JPEG, width: 1280, height: 640 });
    }),
  };
  const input: VisionTurnInput = {
    userId: 7,
    journeyId: 12,
    threadId: 4,
    connection: { kind: 'anthropic', model: 'claude-sonnet-5', host: 'api.anthropic.com' },
    renders: true,
    w: w as unknown as UiStreamWriter,
    signal: stop.signal,
  };
  return { vision, connections, books, photos, asked, input, inner: fixture.inner };
}

describe('AssistantVision', () => {
  it('ASTVSN-001: images go only when the Studio draws, the model reads images and the user said yes', async () => {
    const t = setup();
    expect((await t.vision.forTurn(t.input)).sendsImages()).toBe(true);
    expect(t.connections.studioImagesAcked).toHaveBeenCalledWith(7, t.input.connection);
    expect((await t.vision.forTurn({ ...t.input, renders: false })).sendsImages()).toBe(false);
    const textModel = { kind: 'custom' as const, model: 'llama3', host: 'ollama:11434' };
    expect((await t.vision.forTurn({ ...t.input, connection: textModel })).sendsImages()).toBe(false);
    const notAcked = setup({ acked: false });
    expect((await notAcked.vision.forTurn(notAcked.input)).sendsImages()).toBe(false);
  });

  it('ASTVSN-002: a look draws only the user own photos; the image goes to the model, never stored', async () => {
    const t = setup();
    const run = await (await t.vision.forTurn(t.input)).look(t.inner);
    expect(t.asked).toEqual([
      { requestId: expect.any(String), threadId: 4, spreadId: t.inner, bookVersion: 4, hiddenPhotoIds: [2] },
    ]);
    expect(run.ok).toBe(true);
    expect(run.images).toEqual([{ mimeType: 'image/jpeg', data: JPEG.toString('base64') }]);
    expect(run.view).toMatchObject({ spreadId: t.inner, bookVersion: 4, width: 1280, height: 640, bytes: JPEG.length });
    expect(run.view?.description).toContain('photo 2, by another contributor, not shown');
    expect(run.value).toMatchObject({ spreadId: t.inner, proposed: false, findings: expect.any(Array) });
    expect(JSON.stringify([run.value, run.view])).not.toContain(JPEG.toString('base64'));
  });

  it('ASTVSN-003: a text-only turn describes the page without asking the Studio or hiding anything', async () => {
    const t = setup();
    const run = await (await t.vision.forTurn({ ...t.input, renders: false })).look(t.inner);
    expect(t.asked).toEqual([]);
    expect(t.photos.ownPhotoIds).not.toHaveBeenCalled();
    expect(run.images).toBeUndefined();
    expect(run.view).toMatchObject({ width: null, height: null, bytes: null });
    expect(run.view?.description).not.toContain('not shown');
    expect(run.value).not.toHaveProperty('image');
  });

  it('ASTVSN-004: a proposal goes as the page applied on a copy; no image in time leaves the description', async () => {
    const t = setup({ upload: false });
    const ops = [{ op: 'background' as const, color: '#112233' }];
    const run = await (await t.vision.forTurn(t.input)).look(t.inner, ops);
    expect(t.asked[0]).toMatchObject({
      spreadId: t.inner,
      bookVersion: 4,
      spread: { id: t.inner, background: '#112233' },
    });
    expect(t.asked[0]).not.toHaveProperty('ops');
    expect(run.ok).toBe(true);
    expect(run.images).toBeUndefined();
    expect(run.value).toMatchObject({ proposed: true, image: expect.stringContaining('did not send') });
    expect(t.books.trialBase).toHaveBeenCalledWith(12, 7);
  });

  it('ASTVSN-005: a look at nothing says why: no book, no such page, an op the book refuses, no access', async () => {
    const t = setup();
    const vision = await t.vision.forTurn(t.input);
    expect(await vision.look('sp-missing')).toMatchObject({ ok: false, value: expect.stringContaining('no page') });
    const locked = await vision.look(t.inner, [{ op: 'remove', elementId: 'nope' } as never]);
    expect(locked).toMatchObject({ ok: false, value: expect.stringContaining('Not a change the book takes') });
    const empty = setup({ doc: null });
    const noBook = await (await empty.vision.forTurn(empty.input)).look('sp-1');
    expect(noBook).toEqual({ ok: false, value: 'This journey has no book yet: create_book makes one.' });
    t.books.trialBase.mockRejectedValueOnce(new DomainError(404, 'Journey not found'));
    expect(await vision.look(t.inner)).toEqual({ ok: false, value: 'Journey not found' });
    expect(t.asked).toEqual([]);
  });

  it('ASTVSN-006: a refused image makes the model text-only, for this turn and, told to the connections, the next', async () => {
    const t = setup();
    const vision = await t.vision.forTurn(t.input);
    expect(t.connections.readsImages).toHaveBeenCalledWith(t.input.connection);
    vision.refused();
    expect(vision.sendsImages()).toBe(false);
    expect((await vision.look(t.inner)).images).toBeUndefined();
    expect(t.connections.refuseImages).toHaveBeenCalledWith(t.input.connection);
    // The connections now say the model reads no images: the next turn asks for none and is not asked to say yes.
    t.connections.readsImages.mockReturnValueOnce(false);
    t.connections.studioImagesAcked.mockClear();
    expect((await t.vision.forTurn(t.input)).sendsImages()).toBe(false);
    expect(t.connections.studioImagesAcked).not.toHaveBeenCalled();
  });

  it('ASTVSN-007: a decision turn starts with a view of each page the applied book writes left', async () => {
    const t = setup();
    const written = JSON.stringify({ version: 5, spread_ids: [t.inner], pages: [], findings: [], dropped: [] });
    const history: AiChatMessage[] = [
      { role: 'user', text: 'Tidy it' },
      { role: 'assistant', text: '', toolCalls: [] },
      { role: 'tool', toolCallId: 'a', name: 'edit_book_page', output: written },
      { role: 'tool', toolCallId: 'b', name: 'edit_book_page', output: written },
      { role: 'tool', toolCallId: 'c', name: 'get_book', output: '{"exists":true}' },
      { role: 'tool', toolCallId: 'd', name: 'edit_book_page', output: written, isError: true },
    ];
    const seen = await (await t.vision.forTurn(t.input)).afterApply(history);
    expect(t.asked).toHaveLength(1);
    expect(seen.map((m) => (m.role === 'tool' ? (m.images?.length ?? 0) : null))).toEqual([null, null, 0, 1, 0, 0]);
    expect(history[3]).not.toHaveProperty('images');

    const textOnly = setup();
    const unchanged = await (await textOnly.vision.forTurn({ ...textOnly.input, renders: false })).afterApply(history);
    expect(unchanged).toEqual(history);
    expect(textOnly.books.trialBase).not.toHaveBeenCalled();
  });

  it('ASTVSN-008: a Studio turn gets the page preview beside its tools; a trip turn its session as it is', async () => {
    const t = setup();
    const session = {
      specs: () => [],
      kindOf: () => null,
      pinArgs: (_name: string, args: Record<string, unknown>) => ({ args }),
      call: async () => ({ ok: true, value: null }),
    } as unknown as AssistantToolSession;
    const trip = await t.vision.turnTools({ kind: 'trip', tripId: 3 }, session, t.input);
    expect(trip).toEqual({ tools: session, vision: null });
    const studio = await t.vision.turnTools({ kind: 'journey', journeyId: 12 }, session, t.input);
    expect(studio.vision?.sendsImages()).toBe(true);
    expect(studio.tools.specs().map((spec) => spec.name)).toEqual(['preview_book_page']);
  });

  it('ASTVSN-009: a map that marks its stops with photos draws only the user own ones', async () => {
    const t = setup();
    const { doc, inner } = book();
    const spread = doc.spreads[2];
    if (!spread) throw new Error('no inner spread');
    const point = (photoId: number | null) => ({ lat: 38.7, lng: -9.1, label: '', photoId });
    const map = bookMapElementSchema.parse({
      id: 'm-1',
      kind: 'map',
      frame: { x: 20, y: 140, w: 200, h: 120 },
      pinStyle: 'photo',
      points: [point(1), point(3), point(null), point(3)],
    });
    doc.spreads[2] = { ...spread, elements: [...spread.elements, map] };
    t.books.trialBase.mockResolvedValueOnce({ doc, version: 4, ctx: { photos: [{ photoId: 1 }, { photoId: 2 }] } });
    await (await t.vision.forTurn(t.input)).look(inner);
    expect(t.asked[0]?.hiddenPhotoIds).toEqual([2, 3]);
  });

  it('ASTVSN-010: a journey that went away while the turn ran is a look that says so, with no page drawn', async () => {
    const t = setup();
    const vision = await t.vision.forTurn(t.input);
    t.photos.ownPhotoIds.mockRejectedValueOnce(new DomainError(404, 'Journey not found'));
    expect(await vision.look(t.inner)).toEqual({ ok: false, value: 'Journey not found' });
    expect(t.asked).toEqual([]);
  });

  it('ASTVSN-012: a proposal is drawn as the server applied it, with journey words the Studio lacks', async () => {
    const t = setup();
    // The journal's caption of photo 1: only the server's book context holds it.
    const photos = [{ photoId: 1, caption: 'Alfama at dusk' }, { photoId: 2 }];
    t.books.trialBase.mockResolvedValueOnce({ doc: book().doc, version: 4, ctx: { photos } });
    const vision = await t.vision.forTurn(t.input);

    const run = await vision.look(t.inner, [{ op: 'caption', photoElementId: 'p-own' }]);

    expect(run.ok).toBe(true);
    const drawn = t.asked[0]?.spread;
    expect(drawn?.id).toBe(t.inner);
    expect(drawn?.elements.some((el) => el.kind === 'text' && el.text === 'Alfama at dusk')).toBe(true);
    // The page as it stands is drawn from the book the Studio reads, never sent along.
    await vision.look(t.inner);
    expect(t.asked[1]).not.toHaveProperty('spread');
  });

  it('ASTVSN-011: a page of a design draft is read from the draft and the Studio is told to draw it from there', async () => {
    const t = setup();
    const vision = await t.vision.forTurn(t.input);

    const run = await vision.look(t.inner, undefined, 'd-1');

    expect(t.books.trialBase).toHaveBeenCalledWith(12, 7, 'd-1');
    expect(t.asked[0]).toMatchObject({ spreadId: t.inner, bookVersion: 4, designId: 'd-1', hiddenPhotoIds: [2] });
    expect(run.ok).toBe(true);
    await vision.look(t.inner);
    expect(t.books.trialBase).toHaveBeenLastCalledWith(12, 7);
    expect(t.asked[1]).not.toHaveProperty('designId');
  });
});
