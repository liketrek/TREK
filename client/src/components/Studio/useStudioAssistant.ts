import {
  ASSISTANT_PAGE_IMAGE,
  bookElementIdSchema,
  bookSpreadIdSchema,
  type AssistantPageRender,
  type BookDocument,
  type BookPageSetup,
  type BookSpread,
} from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { assistantRepo } from '../../repo/assistantRepo';
import { assistantChatKey } from '../../store/assistantChatKey';
import { useAssistantStore } from '../../store/assistantStore';
import { useStudioStore } from '../../store/studioStore';
import { foliosOf } from './bookSheets';
import { sheetSizePx, snapshotSpread } from './pageSnapshot';

/**
 * The assistant inside TREK Studio (journey-studio.md 4.5): whether its column
 * is open, the journey's chat it hosts, and what the Studio does for that chat.
 *
 * - Before a turn or an apply goes out, the book's local work is written
 *   (`flush`), so the assistant edits the book the user sees.
 * - Each question carries the page on screen and the elements selected on it.
 * - A page a turn asks to look at is drawn here, by the editor's own
 *   SpreadView off screen, and uploaded as an image (3.1): a page of the
 *   book, of a design draft the assistant has not applied yet, or a
 *   proposal's page as the server applied it.
 * - `?page=<spread id>`, which a page card opens, shows that page.
 */

/** Where the column's open state is kept between visits, like the planner's assistant window. */
const OPEN_STORAGE = 'trek.studioAssistant';

/** Element ids a question's focus carries at most, as the contract takes them. */
const MAX_FOCUS_ELEMENTS = 30;

/** One page a turn asked for, ready for the stage to draw. */
export interface StudioRenderJob {
  request: AssistantPageRender;
  spread: BookSpread;
  page: BookPageSetup;
  folios: number[];
  hidden: ReadonlySet<number>;
  /** Ends with the turn, or once the turn has stopped waiting for the page. */
  signal: AbortSignal;
  /** Lets go of the turn's signal once the page is sent or given up. */
  release: () => void;
}

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(OPEN_STORAGE) === '1';
  } catch {
    return false;
  }
}

function writeOpen(open: boolean): void {
  try {
    window.localStorage.setItem(OPEN_STORAGE, open ? '1' : '0');
  } catch {
    // Storage refused (a private window): the column stays as it is for this visit only.
  }
}

/** The turn's signal, also ended once the turn has stopped waiting for the page. */
function withDeadline(signal: AbortSignal): { signal: AbortSignal; release: () => void } {
  const controller = new AbortController();
  const stop = () => controller.abort();
  const timer = setTimeout(stop, ASSISTANT_PAGE_IMAGE.timeoutMs);
  signal.addEventListener('abort', stop, { once: true });
  if (signal.aborted) stop();
  return {
    signal: controller.signal,
    release: () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', stop);
    },
  };
}

/**
 * The page a request asks for, from the book at the version it names. A
 * preview carries the proposal's page as the server applied it, with the
 * journey's photos, words and figures this tab does not hold: that page is
 * drawn in place of the stored one, nothing saved. A proposal changes only
 * its own page, so the page setup and the folios stay the book's. Null when
 * the page is gone, so nothing is drawn.
 */
export function renderJobOf(
  doc: BookDocument,
  request: AssistantPageRender,
  deadline: { signal: AbortSignal; release: () => void }
): StudioRenderJob | null {
  const index = doc.spreads.findIndex((s) => s.id === request.spreadId);
  const stored = doc.spreads[index];
  if (!stored) return null;
  const spread = request.spread?.id === stored.id ? request.spread : stored;
  return {
    request,
    spread,
    page: doc.page,
    folios: foliosOf(doc.spreads, index, doc.page.pageNumbers.startAt),
    hidden: new Set(request.hiddenPhotoIds),
    ...deadline,
  };
}

/**
 * The job for a request, from the book as the server holds it, or from the
 * design draft the request names (`designId`, a page of a whole-book design
 * not applied yet); null when the page cannot be drawn.
 */
async function jobFor(
  journeyId: number,
  request: AssistantPageRender,
  deadline: { signal: AbortSignal; release: () => void }
): Promise<StudioRenderJob | null> {
  try {
    const book = request.designId
      ? await assistantRepo.pageDraft(journeyId, request.designId)
      : await assistantRepo.pageBook(journeyId);
    // Moved on since the turn asked: an image of another version would be refused, so it goes on as text.
    if (!book || book.version !== request.bookVersion || deadline.signal.aborted) return null;
    return renderJobOf(book.document, request, deadline);
  } catch {
    // Offline or refused: the turn waits out its time and goes on with the page's description.
    return null;
  }
}

/** A drawn sheet as an image, sent to the turn that asked for it. */
async function sendPage(journeyId: number, job: StudioRenderJob, sheet: HTMLElement): Promise<void> {
  if (job.signal.aborted) return;
  const shot = await snapshotSpread(sheet, sheetSizePx(job.spread, job.page), job.hidden);
  if (!shot || job.signal.aborted) return;
  const { bookVersion, spreadId, threadId, requestId } = job.request;
  const page = { image: shot.image, bookVersion, spreadId, drawnPhotoIds: shot.drawnPhotoIds };
  await assistantRepo.uploadRender(journeyId, threadId, requestId, page, job.signal);
}

/** The pages turns ask for: read at their version, queued for the stage, drawn and uploaded. */
function usePageRenders(journeyId: number) {
  const [jobs, setJobs] = useState<StudioRenderJob[]>([]);

  const prepare = useCallback(
    async (request: AssistantPageRender, signal: AbortSignal) => {
      const deadline = withDeadline(signal);
      const job = await jobFor(journeyId, request, deadline);
      if (job) setJobs((current) => [...current, job]);
      else deadline.release();
    },
    [journeyId]
  );

  const render = useCallback(
    (request: AssistantPageRender, signal: AbortSignal) => {
      void prepare(request, signal);
    },
    [prepare]
  );

  /** The stage drew a job's page: turn it into an image and send it, then take it off the stage. */
  const drawn = useCallback(
    async (job: StudioRenderJob, sheet: HTMLElement) => {
      try {
        await sendPage(journeyId, job, sheet);
      } catch {
        // A page that cannot be drawn or sent is never the user's error: the turn goes on with the description.
      } finally {
        job.release();
        setJobs((current) => current.filter((j) => j !== job));
      }
    },
    [journeyId]
  );

  return { jobs, render, drawn };
}

/** Each question carries the page on screen and the elements selected on it, as far as the contract takes them. */
function useStudioFocus(key: number, open: boolean) {
  const spreadId = useStudioStore((st) => st.doc?.spreads[st.activeSpread]?.id ?? null);
  const selection = useStudioStore((st) => st.selection);
  const setFocus = useAssistantStore((s) => s.setFocus);

  useEffect(() => {
    if (!open) return;
    if (spreadId === null || !bookSpreadIdSchema.safeParse(spreadId).success) {
      setFocus(key, null);
      return;
    }
    const elementIds = selection.filter((id) => bookElementIdSchema.safeParse(id).success).slice(0, MAX_FOCUS_ELEMENTS);
    setFocus(key, elementIds.length > 0 ? { spreadId, elementIds } : { spreadId });
  }, [open, key, spreadId, selection, setFocus]);
}

/** `?page=<spread id>`, which a page card opens: shows that page once the book is there, then leaves the address. */
function usePageParam() {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('page');
  const loaded = useStudioStore((st) => st.doc !== null);
  const setActiveSpread = useStudioStore((st) => st.setActiveSpread);

  useEffect(() => {
    if (wanted === null || !loaded) return;
    const index = useStudioStore.getState().doc?.spreads.findIndex((s) => s.id === wanted) ?? -1;
    if (index >= 0) setActiveSpread(index);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [wanted, loaded, setActiveSpread, setParams]);
}

export function useStudioAssistant({ journeyId, flush }: { journeyId: number; flush: () => Promise<boolean> }) {
  const key = assistantChatKey({ kind: 'journey', journeyId });
  const available = useAssistantStore((s) => s.status?.available === true);
  const hasStatus = useAssistantStore((s) => s.status !== null);
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const hostStudio = useAssistantStore((s) => s.hostStudio);
  const [open, setOpen] = useState(readOpen);
  const renders = usePageRenders(journeyId);
  const { render } = renders;
  const showing = open && available;

  // The planner's window loads it too; the Studio may be the first to ask.
  useEffect(() => {
    if (!hasStatus) void loadStatus();
  }, [hasStatus, loadStatus]);

  // The chat is hosted while its column shows: closing it ends the chat's turn anyway.
  useEffect(() => {
    if (!showing) return undefined;
    return hostStudio(key, { render, flush });
  }, [showing, key, render, flush, hostStudio]);

  useStudioFocus(key, showing);
  usePageParam();

  const toggle = useCallback(() => {
    writeOpen(!open);
    setOpen(!open);
  }, [open]);

  return {
    /** The chat's key in the assistant store. */
    chatKey: key,
    /** Whether the assistant can run for this user at all; the toggle shows only then. */
    available,
    /** Whether the chat column shows. */
    open: showing,
    toggle,
    /** The pages being drawn for a turn, for the stage. */
    jobs: renders.jobs,
    drawn: renders.drawn,
  };
}

export type StudioAssistant = ReturnType<typeof useStudioAssistant>;
