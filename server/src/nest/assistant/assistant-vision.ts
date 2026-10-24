import type { AiChatMessage, AiImage } from '../ai-connections/ai-chat-client.interface';
import { AiConnectionsService } from '../ai-connections/ai-connections.service';
import type { ResolvedAiConnection } from '../ai-connections/ai-connections.types';
import { logDebug } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { withRequestContext } from '../database/request-context';
import { JourneyAiPhotosService } from '../journey/journey-ai-photos.service';
import { JourneyBookEditService, type BookTrialBase } from '../journey/journey-book-edit.service';
import type { AgentToolPort, AgentToolRun, AgentVision } from './assistant-agent';
import { withPagePreview } from './assistant-book-preview';
import { AssistantRenderRegistry, type PageImage } from './assistant-render.registry';
import type { UiStreamWriter } from './ui-stream.writer';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import {
  applyBookOps,
  ASSISTANT_PAGE_IMAGE,
  bookWriteResultSchema,
  describeSpread,
  type AssistantPageView,
  type AssistantScope,
  type BookDocument,
  type BookElement,
  type BookPageOp,
  type BookSpread,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/**
 * The Studio assistant looking at a page (journey-studio.md 3): the page in
 * words for every model, and for a model that reads images the page as the
 * Studio draws it. The server cannot draw a page, so a look streams a render
 * request to the Studio tab that holds the turn and waits a bounded time for
 * its upload (AssistantRenderRegistry); no image in time is the description
 * alone, never an error.
 *
 * Images go only when all of this holds for the turn: the client draws pages
 * (the Studio's chat says so with `renders`), the model reads images (by its
 * kind and id, and not refused one before in this process), and the user let
 * this connection receive page images (their Studio acknowledgement). Only the
 * user's own photos are drawn; the others go as empty frames, before anything
 * is rasterised, and the description says so. Nothing of an image is stored:
 * the message keeps what was looked at (`data-trek-page-view`), the bytes live
 * for the turn's next model request.
 */

/** One Studio turn's view of its pages. */
export interface TurnVision extends AgentVision {
  /** Whether this turn sends page images to the model, as of now. */
  sendsImages(): boolean;
  /**
   * One page as it stands or, with `ops`, as an `edit_book_page` with them
   * would leave it, nothing saved; with `designId` the page of that design
   * draft (design_book) instead of the book's.
   */
  look(spreadId: string, ops?: BookPageOp[], designId?: string): Promise<AgentToolRun>;
}

/** What a Studio turn brings to its pages. */
export interface VisionTurnInput {
  userId: number;
  journeyId: number;
  threadId: number;
  connection: Pick<ResolvedAiConnection, 'kind' | 'model' | 'host'>;
  /** The client draws pages for this turn (the Studio's chat). */
  renders: boolean;
  w: UiStreamWriter;
  signal: AbortSignal;
}

const NO_BOOK = 'This journey has no book yet: create_book makes one.';
const LATE = 'The Studio did not send the page image in time; check the page on its description.';

/** A page image as a model request carries it. */
function asAiImage(image: PageImage): AiImage {
  return { mimeType: image.mimeType, data: image.data.toString('base64') };
}

/** The photos an element shows: a photo frame's own, and the pictures a map draws its stops with. */
function photosOf(el: BookElement): number[] {
  if (el.kind === 'photo') return el.photoId === null ? [] : [el.photoId];
  if (el.kind === 'map') return el.points.flatMap((point) => (point.photoId === null ? [] : [point.photoId]));
  return [];
}

/** The photos on a page that the user did not contribute: drawn as empty frames (or plain map stops). */
function hiddenOn(doc: BookDocument, spreadId: string, own: ReadonlySet<number>): number[] {
  const spread = doc.spreads.find((s) => s.id === spreadId);
  const ids = new Set<number>();
  for (const el of spread?.elements ?? []) {
    for (const photoId of photosOf(el)) if (!own.has(photoId)) ids.add(photoId);
  }
  return [...ids];
}

/** The page a successful book write left, from its answer as the model read it; null for anything else. */
function writtenPage(message: AiChatMessage): string | null {
  if (message.role !== 'tool' || message.isError) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(message.output);
  } catch {
    return null;
  }
  const result = bookWriteResultSchema.safeParse(parsed);
  return result.success ? (result.data.spread_ids[0] ?? null) : null;
}

/** The page as a proposed edit would leave it (the stored one without ops), or why the book refuses the edit. */
function pageAfter(
  doc: BookDocument,
  spreadId: string,
  ops: BookPageOp[] | undefined,
  base: BookTrialBase,
): BookDocument | string {
  if (!ops) return doc;
  const made = applyBookOps(doc, { spreadId, ops }, base.ctx);
  // Compared with false, not read as a truth value: the non-strict compile narrows the union only that way.
  if (made.ok === false) {
    const at = made.error.opIndex === null ? '' : ` (operation ${made.error.opIndex})`;
    return `Not a change the book takes${at}: ${made.error.code}: ${made.error.message}`;
  }
  return made.doc;
}

/** What the message keeps of a look: the page, the version, the image's size when one came, the description. */
function viewOf(spreadId: string, bookVersion: number, text: string, image: PageImage | null): AssistantPageView {
  return {
    spreadId,
    bookVersion,
    width: image?.width ?? null,
    height: image?.height ?? null,
    bytes: image ? image.data.length : null,
    description: text.slice(0, 20_000),
  };
}

/** Why a look found nothing, in the words a tool would answer. */
function reason(err: unknown): string {
  if (err instanceof DomainError) return err.mcpMessage ?? err.publicMessage;
  return err instanceof Error ? err.message : String(err);
}

/** Builds each Studio turn's vision; the connections remember the models a provider refused an image for. */
@Injectable()
export class AssistantVision {
  constructor(
    private readonly connections: AiConnectionsService,
    private readonly books: JourneyBookEditService,
    private readonly photos: JourneyAiPhotosService,
    private readonly registry: AssistantRenderRegistry,
    private readonly orm: MikroORM,
  ) {}

  /** A turn's tools and its vision: a Studio turn's with the page preview beside them, a trip turn's as they are. */
  async turnTools(
    scope: AssistantScope,
    session: AgentToolPort,
    input: Omit<VisionTurnInput, 'journeyId'>,
  ): Promise<{ tools: AgentToolPort; vision: TurnVision | null }> {
    if (scope.kind !== 'journey') return { tools: session, vision: null };
    const vision = await this.forTurn({ ...input, journeyId: scope.journeyId });
    return { tools: withPagePreview(session, vision), vision };
  }

  async forTurn(input: VisionTurnInput): Promise<TurnVision> {
    let images =
      input.renders &&
      this.connections.readsImages(input.connection) &&
      (await withRequestContext(this.orm, () => this.connections.studioImagesAcked(input.userId, input.connection)));
    const vision: TurnVision = {
      sendsImages: () => images,
      look: (spreadId, ops, designId) => this.look(input, images, spreadId, { ops, designId }),
      refused: () => {
        images = false;
        this.connections.refuseImages(input.connection);
      },
      afterApply: (history) => (images ? this.afterApply(vision, history) : Promise.resolve([...history])),
    };
    return vision;
  }

  /**
   * The history a decision's turn starts from, with a view of each page the
   * applied book writes left attached to the write's own answer (4.3, step
   * 3), so the model checks what the user took before it goes on. At most as
   * many as one request carries, one image each, the same page once.
   */
  private async afterApply(vision: TurnVision, history: readonly AiChatMessage[]): Promise<AiChatMessage[]> {
    const out = [...history];
    let start = out.length;
    while (start > 0 && out[start - 1]?.role === 'tool') start--;
    const seen = new Set<string>();
    const targets: Array<{ index: number; spreadId: string }> = [];
    for (let index = out.length - 1; index >= start && targets.length < ASSISTANT_PAGE_IMAGE.perRequest; index--) {
      const message = out[index];
      const spreadId = message ? writtenPage(message) : null;
      if (spreadId && !seen.has(spreadId)) {
        seen.add(spreadId);
        targets.push({ index, spreadId });
      }
    }
    // One after another: the Studio draws one page at a time.
    await targets.reduce<Promise<void>>(async (previous, { index, spreadId }) => {
      await previous;
      const seenPage = await vision.look(spreadId);
      const message = out[index];
      if (seenPage.images?.length && message?.role === 'tool') out[index] = { ...message, images: seenPage.images };
    }, Promise.resolve());
    return out;
  }

  private async look(
    input: VisionTurnInput,
    withImage: boolean,
    spreadId: string,
    { ops, designId }: { ops?: BookPageOp[]; designId?: string },
  ): Promise<AgentToolRun> {
    let base: BookTrialBase;
    let own: ReadonlySet<number> | null;
    const { journeyId, userId } = input;
    try {
      // A draft's page is read from the draft at the version it was made against; the book's as it stands.
      base = await withRequestContext(this.orm, () =>
        designId ? this.books.trialBase(journeyId, userId, designId) : this.books.trialBase(journeyId, userId),
      );
      // Whose photos the image may show; the journey can have gone away since the turn began.
      own = withImage
        ? await withRequestContext(this.orm, () => this.photos.ownPhotoIds(input.journeyId, input.userId))
        : null;
    } catch (err) {
      return { ok: false, value: reason(err) };
    }
    if (!base.doc || base.version === null) return { ok: false, value: NO_BOOK };
    const doc = pageAfter(base.doc, spreadId, ops, base);
    if (typeof doc === 'string') return { ok: false, value: doc };
    const hidden = own ? hiddenOn(doc, spreadId, own) : [];
    // A page naming more photos than a render request may list is checked on its description alone.
    const draws = withImage && hidden.length <= ASSISTANT_PAGE_IMAGE.maxPagePhotos;
    const photos = (base.ctx.photos ?? []).map((p) => (hidden.includes(p.photoId) ? { ...p, hidden: true } : p));
    const described = describeSpread(doc, spreadId, photos);
    if (!described) return { ok: false, value: `This book has no page ${spreadId}: get_book lists its pages.` };
    // A proposal goes as the page applied here, with the journey's photos, words and figures the Studio lacks.
    const spread = ops ? doc.spreads.find((s) => s.id === spreadId) : undefined;
    const image = draws
      ? await this.render(input, { spreadId, bookVersion: base.version, spread, designId, hidden })
      : null;
    const value = {
      spreadId,
      index: described.index,
      role: described.role,
      proposed: !!ops,
      description: described.text,
      findings: described.findings,
      ...(withImage ? { image: image ? 'The page as the Studio draws it is attached.' : LATE } : {}),
    };
    const view = viewOf(spreadId, base.version, described.text, image);
    return { ok: true, value, view, ...(image ? { images: [asAiImage(image)] } : {}) };
  }

  /** Asks the Studio tab for the page and waits for it; null when none came in time or the turn stopped. */
  private async render(
    input: VisionTurnInput,
    page: { spreadId: string; bookVersion: number; spread?: BookSpread; designId?: string; hidden: number[] },
  ): Promise<PageImage | null> {
    const requestId = randomUUID();
    const { userId, journeyId, threadId, signal } = input;
    const { spreadId, bookVersion, spread, designId, hidden } = page;
    // Waiting before asking: an upload that comes back at once finds its turn.
    const waiting = this.registry.wait(
      { userId, journeyId, threadId, requestId, spreadId, bookVersion },
      signal,
      ASSISTANT_PAGE_IMAGE.timeoutMs,
    );
    // A draft's page: the Studio draws it from the draft (GET .../book-designs/:designId); a proposal's as sent.
    const asked = {
      requestId,
      threadId,
      spreadId,
      bookVersion,
      hiddenPhotoIds: hidden,
      ...(designId ? { designId } : {}),
    };
    input.w.renderRequest(spread ? { ...asked, spread } : asked);
    const image = await waiting;
    // Size and dimensions only: the page shows the user's photos.
    if (image) logDebug(`[assistant] page image ${image.width}x${image.height}, ${image.data.length} bytes`);
    return image;
  }
}
