import type { BookDesignCard, BookDesignDraftResponse, BookDocument, BookPageSetup } from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { bookDesignRepo } from '../../../../repo/bookDesignRepo';
import { useAssistantStore } from '../../../../store/assistantStore';
import { useStudioStore } from '../../../../store/studioStore';
import { useAssistantScope, useAssistantView } from '../../assistantViewContext';
import { studioTarget } from '../book/bookLook';
import { appliedPairs, draftPairs, toggledSelection, type DesignPair } from './bookDesignModel';

/**
 * What the whole-book design card draws and does: the draft (read from the
 * server while the design waits), the book beside it (the Studio's own copy
 * in this journey's Studio, else read once), the pages chosen for the apply,
 * and the way to a page.
 *
 * A choice is shown at once and sent 300 ms after the last press, the whole
 * selection in one request; a refusal puts back what the server last kept and
 * says so, and an answer never overwrites a newer choice. A choice still
 * waiting is sent at once when the pointer or the focus leaves the pages (the
 * way to Apply) and when the card goes away. A decision of the chat waits for
 * the choice: it sends one still waiting, and goes out once every request sent
 * for the pages has landed, one sent by a card that went away since too, so
 * Apply applies the pages shown.
 */

/** How long the card waits after the last press before it sends the selection. */
const SELECT_DEBOUNCE_MS = 300;

/** Where a read stands: still on its way, done, gone from the server (410), or failed otherwise. */
type ReadState<T> =
  { status: 'loading' } | { status: 'ready'; value: T } | { status: 'expired' } | { status: 'failed' };

const LOADING = { status: 'loading' } as const;

/** A draft the server forgot, or one another user made: 410. */
function isGone(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 410;
}

/** A read answered for `key`; an answer for another key is never shown. */
interface Keyed<T> {
  key: string;
  state: ReadState<T>;
}

/** The draft of the card while `active`. */
function useDraftRead(card: BookDesignCard, active: boolean): ReadState<BookDesignDraftResponse> {
  const { journeyId, designId } = card;
  const key = active ? `${journeyId}:${designId}` : null;
  const [read, setRead] = useState<Keyed<BookDesignDraftResponse> | null>(null);
  useEffect(() => {
    if (key === null) return undefined;
    let live = true;
    bookDesignRepo.draft(journeyId, designId).then(
      (value) => {
        if (live) setRead({ key, state: { status: 'ready', value } });
      },
      (err: unknown) => {
        if (live) setRead({ key, state: { status: isGone(err) ? 'expired' : 'failed' } });
      }
    );
    return () => {
      live = false;
    };
  }, [key, journeyId, designId]);
  return key !== null && read?.key === key ? read.state : LOADING;
}

/** The book as the card reads it, and whether it is the Studio's own copy. */
interface BookRead {
  own: boolean;
  state: ReadState<BookDocument | null>;
}

/** The book beside the design: the Studio's own copy where the chat is this journey's, else read once per `mode`. */
function useBookRead(journeyId: number, mode: string): BookRead {
  const scope = useAssistantScope();
  const studioDoc = useStudioStore((s) => s.doc);
  const own = scope.kind === 'journey' && scope.journeyId === journeyId && studioDoc !== null;
  const key = own ? null : `${journeyId}:${mode}`;
  const [read, setRead] = useState<Keyed<BookDocument | null> | null>(null);
  useEffect(() => {
    if (key === null) return undefined;
    let live = true;
    bookDesignRepo.book(journeyId).then(
      (value) => {
        if (live) setRead({ key, state: { status: 'ready', value } });
      },
      () => {
        if (live) setRead({ key, state: { status: 'failed' } });
      }
    );
    return () => {
      live = false;
    };
  }, [key, journeyId]);
  if (own) return { own, state: { status: 'ready', value: studioDoc } };
  return { own, state: key !== null && read?.key === key ? read.state : LOADING };
}

/** A selection sent later, and the timer that sends it. */
interface Outbox {
  timer: number | null;
  flush: (() => void) | null;
}

/** The pages chosen for the apply: shown at once, sent after a pause, put back when the server refuses. */
function useSelection(card: BookDesignCard, draft: BookDesignDraftResponse | null, editable: boolean) {
  const { journeyId, designId } = card;
  const key = draft ? `${journeyId}:${designId}` : null;
  const chatKey = useAssistantView().tripId;
  const holdDecisions = useAssistantStore((s) => s.holdDecisions);
  const [chosen, setChosen] = useState<{ key: string; ids: string[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const outbox = useRef<Outbox>({ timer: null, flush: null });
  // The newest selection the server answered, with the request it answered: an older answer arriving last never wins.
  const confirmed = useRef<{ seq: number; ids: string[] } | null>(null);
  const sent = useRef(0);
  // The choices made here: an answer to a request made before the newest choice never overwrites it.
  const edits = useRef(0);
  // The newest request sent for the pages: a decision of the chat waits for it once it sent the choice still waiting.
  const latest = useRef<Promise<unknown> | null>(null);
  const selection = useMemo(
    () => (key !== null && chosen?.key === key ? chosen.ids : (draft?.selection ?? [])),
    [key, chosen, draft]
  );
  const order = useMemo(
    () => (draft?.plan ?? []).filter((row) => row.action !== 'keep').map((row) => row.spreadId),
    [draft]
  );

  const send = useCallback(
    (ids: string[]) => {
      if (key === null || !draft) return;
      const proposed = draft.selection;
      sent.current += 1;
      const mine = sent.current;
      const edit = edits.current;
      const request = bookDesignRepo.select(journeyId, designId, ids).then(
        (kept) => {
          if (confirmed.current === null || mine > confirmed.current.seq) confirmed.current = { seq: mine, ids: kept };
          // A newer request, or a newer choice still waiting for its pause, decides what is shown.
          if (mine === sent.current && edit === edits.current) setChosen({ key, ids: kept });
        },
        () => {
          if (mine !== sent.current || edit !== edits.current) return;
          setChosen({ key, ids: confirmed.current?.ids ?? proposed });
          setFailed(true);
        }
      );
      latest.current = request;
      // Each request holds the chat's decisions back until it landed, past the card: one that went away and came back
      // still waits for what it sent before.
      const release = holdDecisions(chatKey, () => request);
      void request.finally(release);
    },
    [key, draft, journeyId, designId, chatKey, holdDecisions]
  );

  const toggle = useCallback(
    (spreadId: string) => {
      if (key === null || !editable) return;
      edits.current += 1;
      const next = toggledSelection(selection, spreadId, order);
      setChosen({ key, ids: next });
      setFailed(false);
      const box = outbox.current;
      if (box.timer !== null) window.clearTimeout(box.timer);
      const sendNow = () => {
        box.timer = null;
        box.flush = null;
        send(next);
      };
      box.flush = sendNow;
      box.timer = window.setTimeout(sendNow, SELECT_DEBOUNCE_MS);
    },
    [key, editable, selection, order, send]
  );

  // A choice still waiting is sent now: the pointer or the focus left the pages (on its way to Apply), or the card
  // went away.
  const flush = useCallback(() => {
    const box = outbox.current;
    if (box.timer !== null) window.clearTimeout(box.timer);
    box.flush?.();
  }, []);
  useEffect(() => flush, [flush]);

  // While the pages can be chosen, a decision of this chat first sends a choice still waiting: the apply reads the
  // selection the server holds. The store asks the holds it found before this one sends, so it answers for the request
  // it sent itself; the requests sent before hold by themselves.
  const settle = useCallback(() => {
    flush();
    return latest.current ?? Promise.resolve();
  }, [flush]);
  useEffect(() => (editable ? holdDecisions(chatKey, settle) : undefined), [editable, chatKey, holdDecisions, settle]);

  const chosenSet = useMemo(() => new Set(selection), [selection]);
  return { chosen: chosenSet, toggle, flush, failed };
}

/** Shows a page: in this journey's Studio its page there, elsewhere the Studio opened on it. */
function useShowPage(journeyId: number, own: boolean) {
  const { onOpen } = useAssistantView();
  const setActiveSpread = useStudioStore((s) => s.setActiveSpread);
  return useCallback(
    (spreadId: string) => {
      if (!own) {
        onOpen?.(studioTarget(journeyId, spreadId));
        return;
      }
      const index = useStudioStore.getState().doc?.spreads.findIndex((spread) => spread.id === spreadId) ?? -1;
      if (index >= 0) setActiveSpread(index);
    },
    [journeyId, own, onOpen, setActiveSpread]
  );
}

/** Where the card's pages stand: still loading, drawn, the draft gone, or not readable. */
type DesignStripStatus = 'loading' | 'ready' | 'expired' | 'failed';

interface DesignStrip {
  status: DesignStripStatus;
  pairs: DesignPair[];
  /** The page setup of the book as it is and of the draft; null where it is not read. */
  beforePage: BookPageSetup | null;
  afterPage: BookPageSetup | null;
  chosen: ReadonlySet<string>;
  toggle(spreadId: string): void;
  /** Sends a choice still waiting for its pause at once. */
  flush(): void;
  /** The last choice was refused and put back. */
  selectFailed: boolean;
  show(spreadId: string): void;
}

/**
 * The card's pages: while the design waits (`draft`), each page it changes
 * beside the page of the book it replaces, with the choice of pages when
 * `editable`; once applied (`applied`), the pages it wrote as the book holds
 * them now.
 */
export function useBookDesignDraft(card: BookDesignCard, mode: 'draft' | 'applied', editable: boolean): DesignStrip {
  const draftRead = useDraftRead(card, mode === 'draft');
  const book = useBookRead(card.journeyId, mode);
  const draft = draftRead.status === 'ready' ? draftRead.value : null;
  const bookDoc = book.state.status === 'ready' ? book.state.value : null;
  const selection = useSelection(card, draft, editable);
  const show = useShowPage(card.journeyId, book.own);
  const pairs = useMemo(() => {
    if (mode === 'applied') return appliedPairs(card, bookDoc);
    return draft ? draftPairs(draft, bookDoc) : [];
  }, [mode, card, draft, bookDoc]);
  let status: DesignStripStatus = mode === 'draft' ? draftRead.status : book.state.status;
  if (status === 'ready' && book.state.status === 'loading') status = 'loading';
  return {
    status,
    pairs,
    beforePage: bookDoc?.page ?? null,
    afterPage: mode === 'applied' ? (bookDoc?.page ?? null) : (draft?.document.page ?? null),
    chosen: selection.chosen,
    toggle: selection.toggle,
    flush: selection.flush,
    selectFailed: selection.failed,
    show,
  };
}
