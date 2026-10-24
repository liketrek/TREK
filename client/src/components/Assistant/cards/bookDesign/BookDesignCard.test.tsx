/**
 * FE-BOOKDSN-010 to FE-BOOKDSN-019, FE-BOOKDSN-022, FE-BOOKDSN-030 to FE-BOOKDSN-036
 *
 * The whole-book design in the Studio's chat: the held apply named by its
 * style with its facts, each page it changes drawn beside the page it
 * replaces (the book from the Studio, the draft from the server), a page
 * taken out of the apply sent after a pause and put back when the server
 * refuses, the receipt with the pages it wrote and the ones it left, a draft
 * the server forgot, the way to a page, the draft as an answer card, a
 * choice still waiting sent as the card goes away, and a book that cannot be
 * read; a choice sent at once when the pointer leaves the pages (the way to
 * Apply), and an older answer arriving last never taken for what the server
 * kept; a page pointed at outlined in the Studio's page rail; an answer or a
 * refusal never overwriting a newer choice, Apply waiting for the choice it
 * applies, a page kept for a photo gone, one typeface named once, findings
 * with no fault read as a warning, the receipt opening the Studio on the
 * first page the design wrote, and Apply on a card that came back waiting
 * for the choice the card before it sent.
 */
import {
  type AssistantApplied,
  type AssistantChangePreview,
  type AssistantMessage,
  blankBook,
  type BookDesignCard,
  type BookDesignDraftResponse,
  type BookDocument,
  type BookSpread,
  type UiStreamChunk,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, render, screen, waitFor } from '../../../../../tests/helpers/render';
import { assistantRepo } from '../../../../repo/assistantRepo';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { useStudioStore } from '../../../../store/studioStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { CARD_RULES } from '../cardLooks';
import { BookDesignBlock } from './BookDesignCard';

const repo = vi.hoisted(() => ({ draft: vi.fn(), book: vi.fn(), select: vi.fn() }));
vi.mock('../../../../repo/bookDesignRepo', () => ({ bookDesignRepo: repo }));

const STUDIO = useStudioStore.getState();
const ASSISTANT = useAssistantStore.getState();

/** sp-1 the cover, sp-2 the first page, sp-3 a double page, sp-4 the last page, sp-5 the back. */
function book(): BookDocument {
  let seq = 0;
  return blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
}

function inner(id: string): BookSpread {
  return { id, role: 'inner', background: null, elements: [], parked: [], entryId: null };
}

/** The book in the Studio: a second double page (sp-7) after sp-3. */
function stored(): BookDocument {
  const doc = book();
  return { ...doc, spreads: [...doc.spreads.slice(0, 3), inner('sp-7'), ...doc.spreads.slice(3)] };
}

/** The designed book: sp-3 laid out again, a new double page sp-9, sp-7 dropped. */
function designed(): BookDocument {
  const doc = book();
  return { ...doc, spreads: [...doc.spreads.slice(0, 3), inner('sp-9'), ...doc.spreads.slice(3)] };
}

type Row = [string, number, BookDesignCard['spreads'][number]['action'], number, number];

/** The cover kept, sp-3 laid out again (one fault, one warning), sp-9 new (two warnings), sp-7 dropped. */
const ROWS: Row[] = [
  ['sp-1', 0, 'keep', 0, 0],
  ['sp-3', 2, 'replace', 1, 1],
  ['sp-9', 3, 'insert', 0, 2],
  ['sp-7', 3, 'drop', 0, 0],
];

function draft(rows: Row[] = ROWS, doc: BookDocument = designed()): BookDesignDraftResponse {
  const plan = rows.map(([spreadId, index, action, severe, warn]) => ({
    spreadId,
    index,
    action,
    beat: 'duo' as const,
    chapter: null,
    entryId: null,
    photoIds: [],
    findings: { severe, warn },
  }));
  const selection = rows.filter(([, , action]) => action !== 'keep').map(([spreadId]) => spreadId);
  return { designId: 'd-1', baseVersion: 4, expiresAt: '2026-10-22T18:00:00.000Z', document: doc, plan, selection };
}

function card(over: Partial<BookDesignCard> = {}): BookDesignCard {
  const spreads = ROWS.map(([spreadId, index, action, severe, warn]) => ({
    spreadId,
    index,
    action,
    beat: 'duo' as const,
    chapter: null,
    entryId: null,
    photoCount: 0,
    severe,
    warn,
  }));
  return {
    kind: 'bookDesign',
    change: 'proposed',
    journeyId: 3,
    designId: 'd-1',
    baseVersion: 4,
    style: 'editorial',
    paper: '#faf8f4',
    ink: '#1a1a1a',
    accent: '#c0392b',
    heading: 'playfair',
    body: 'garamond',
    spreads,
    more: 6,
    leftOut: 2,
    revisionId: null,
    skipped: [],
    ...over,
  };
}

function item(state: ChangeItem['state'], held: BookDesignCard): ChangeItem {
  const preview: AssistantChangePreview = {
    toolCallId: 'w1',
    verbKey: 'designBook',
    subject: '',
    rows: [],
    dayId: null,
    placeIds: [],
    undoable: true,
    card: held,
  };
  const receipt: AssistantApplied = { toolCallId: 'w1', entity: 'book_page', ids: [], dayId: null, undoUntil: null };
  return { toolCallId: 'w1', preview, applied: state === 'applied' ? receipt : null, state, card: held };
}

/** The chat of journey 3's Studio (its key is the negated journey id), unless `view` names another. */
function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: -3, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

/** The round choice of a page, by the page's name. */
function choice(page: string, nth = 0): HTMLElement {
  return screen.getAllByRole('button', { name: `${page}: use the new design` })[nth] as HTMLElement;
}

/** The pages of the design, the area a pointer leaves on its way to Apply. */
function pagesArea(): HTMLElement {
  return screen.getByRole('list', { name: 'Pages of the design' }).parentElement as HTMLElement;
}

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

/** The receipt of the design applied, with the pages it left as they were. */
function applied(skipped: BookDesignCard['skipped'] = []): ChangeItem {
  return item('applied', card({ change: 'applied', revisionId: 8, skipped }));
}

beforeEach(() => {
  repo.draft.mockResolvedValue(draft());
  repo.book.mockResolvedValue(stored());
  repo.select.mockImplementation((_journeyId: number, _designId: string, ids: string[]) => Promise.resolve(ids));
});

afterEach(() => {
  useStudioStore.setState(STUDIO, true);
  useAssistantStore.setState(ASSISTANT, true);
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('the whole-book design card', () => {
  it('FE-BOOKDSN-010: a waiting design names its style and facts, and draws each page beside the one it replaces', async () => {
    useStudioStore.setState({ doc: stored(), activeSpread: 0 });
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    expect(screen.getByText('Editorial design')).toBeInTheDocument();
    expect(screen.getByText('Apply the book design')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Paper, ink and accent colour' })).toBeInTheDocument();
    expect(screen.getByText('Playfair Display and EB Garamond')).toBeInTheDocument();
    expect(screen.getByText('3 pages change')).toBeInTheDocument();
    expect(screen.getByText('2 photos left out')).toBeInTheDocument();
    expect(screen.getByText('4 things to check')).toBeInTheDocument();

    // The page laid out again shows before and after; the new page and the dropped one stand alone.
    expect(await screen.findByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getByText('Double page 1')).toBeInTheDocument();
    expect(screen.getAllByText('Double page 2')).toHaveLength(2);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Show this page' })).toHaveLength(4);
    // The page laid out again and the new page each carry two findings; the dropped one none.
    expect(screen.getAllByRole('img', { name: '2 things to check' })).toHaveLength(2);
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'true');
    // The draft comes from the server, the book from the Studio.
    expect(repo.draft).toHaveBeenCalledWith(3, 'd-1');
    expect(repo.book).not.toHaveBeenCalled();
  });

  it('FE-BOOKDSN-011: a page taken out is shown at once and sent after a pause, the last choice only', async () => {
    useStudioStore.setState({ doc: stored() });
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    fireEvent.click(choice('Double page 2', 0));
    fireEvent.click(choice('Double page 2', 1));
    expect(choice('Double page 2', 0)).toHaveAttribute('aria-pressed', 'false');
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'false');
    expect(repo.select).not.toHaveBeenCalled();
    await waitFor(() => expect(repo.select).toHaveBeenCalledTimes(1));
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-3']);

    // Put back in: the pages in the plan's order.
    fireEvent.click(choice('Double page 2', 1));
    await waitFor(() => expect(repo.select).toHaveBeenCalledTimes(2));
    expect(repo.select).toHaveBeenLastCalledWith(3, 'd-1', ['sp-3', 'sp-7']);
  });

  it('FE-BOOKDSN-012: a refused choice is put back to what the server kept, and says so', async () => {
    useStudioStore.setState({ doc: stored() });
    repo.select.mockRejectedValue(new Error('offline'));
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    fireEvent.click(choice('Double page 1'));
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText('The choice of pages could not be saved and was put back.')).toBeInTheDocument();
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-BOOKDSN-013: the receipt draws the pages it wrote as the book holds them, and names the ones it left', async () => {
    useStudioStore.setState({ doc: designed() });
    const skipped: BookDesignCard['skipped'] = [
      { spreadId: 'sp-9', reason: 'changed_since' },
      { spreadId: 'sp-7', reason: 'excluded' },
    ];
    inView(<AssistantChangeCard items={[item('applied', card({ change: 'applied', revisionId: 8, skipped }))]} />);
    expect(screen.getByText('1 page changed since, kept as it is')).toBeInTheDocument();
    expect(screen.getByText('1 page not chosen')).toBeInTheDocument();
    expect(screen.queryByText('3 pages change')).toBeNull();
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(1);
    expect(screen.queryByText('Before')).toBeNull();
    expect(screen.queryByRole('button', { name: /use the new design/ })).toBeNull();
    // The draft is gone with the apply: nothing asks for it.
    expect(repo.draft).not.toHaveBeenCalled();
  });

  it('FE-BOOKDSN-014: a draft the server forgot keeps the badges and says so; any other failure says the pages did not load', async () => {
    useStudioStore.setState({ doc: stored() });
    repo.draft.mockRejectedValue(Object.assign(new Error('gone'), { response: { status: 410 } }));
    const first = inView(<AssistantChangeCard items={[item('pending', card())]} />);
    const gone = await screen.findByText('This draft is gone. Ask for the design again to see its pages.');
    expect(gone).toBeInTheDocument();
    expect(screen.getByText('3 pages change')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
    first.unmount();

    repo.draft.mockRejectedValue(new Error('down'));
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    expect(await screen.findByText('The pages could not be loaded.')).toBeInTheDocument();
  });

  it('FE-BOOKDSN-015: a page opens in the Studio: there its page, elsewhere the Studio on it', async () => {
    useStudioStore.setState({ doc: stored(), activeSpread: 0 });
    const onOpen = vi.fn();
    const own = inView(<AssistantChangeCard items={[item('pending', card())]} />, { onOpen });
    const sheets = await screen.findAllByRole('button', { name: 'Show this page' });
    fireEvent.click(sheets[0] as HTMLElement);
    expect(useStudioStore.getState().activeSpread).toBe(2);
    // The new page (sp-9) is not in the book yet: pressing it leaves the Studio on the page it shows.
    fireEvent.click(sheets[2] as HTMLElement);
    expect(useStudioStore.getState().activeSpread).toBe(2);
    expect(onOpen).not.toHaveBeenCalled();
    own.unmount();

    // A trip's chat: the book is read from the server, and a page opens the Studio on it.
    inView(<AssistantChangeCard items={[item('pending', card())]} />, { tripId: 4, onOpen });
    const away = await screen.findAllByRole('button', { name: 'Show this page' });
    expect(repo.book).toHaveBeenCalledWith(3);
    fireEvent.click(away[0] as HTMLElement);
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/journey/3/studio?page=sp-3' });
  });

  it('FE-BOOKDSN-017: a choice still waiting is sent when the card goes away; a book that cannot be read leaves the draft alone', async () => {
    useStudioStore.setState({ doc: stored() });
    const first = inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    fireEvent.click(choice('Double page 1'));
    first.unmount();
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-9', 'sp-7']);

    // A trip's chat whose book read fails: the draft's pages stand alone, the dropped page has nothing to draw.
    repo.book.mockRejectedValue(new Error('down'));
    inView(<AssistantChangeCard items={[item('pending', card())]} />, { tripId: 4 });
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(2);
    expect(screen.queryByText('Before')).toBeNull();
    expect(screen.getByText('Double page 1')).toBeInTheDocument();
  });

  it('FE-BOOKDSN-016: the draft stands as an answer card that gives way to its proposal; a discarded one draws no pages', async () => {
    useStudioStore.setState({ doc: stored() });
    const many = Array.from({ length: 14 }, (_, i): Row => [`sp-n${i}`, i + 1, 'insert', 0, 0]);
    const doc = book();
    repo.draft.mockResolvedValue(draft(many, { ...doc, spreads: [...doc.spreads, ...many.map(([id]) => inner(id))] }));
    const answer = card({ change: 'none' });
    const message = {} as AssistantMessage;
    const first = inView(<BookDesignBlock cards={[{ toolCallId: 'r1', card: answer }]} message={message} />);
    expect(screen.getByText('Editorial design')).toBeInTheDocument();
    expect(screen.getByText('10 pages')).toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(12);
    expect(screen.queryByRole('button', { name: /use the new design/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show all 14 pages' }));
    expect(screen.getAllByRole('button', { name: 'Show this page' })).toHaveLength(14);
    first.unmount();

    expect(CARD_RULES.yieldsToChange(answer, card())).toBe(true);
    expect(CARD_RULES.yieldsToChange(answer, card({ designId: 'd-2' }))).toBe(false);

    vi.clearAllMocks();
    inView(<AssistantChangeCard items={[item('discarded', card())]} />);
    expect(screen.getByText('Editorial design')).toHaveClass('line-through');
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
    expect(repo.draft).not.toHaveBeenCalled();
  });

  it('FE-BOOKDSN-018: a choice goes out as soon as the pointer leaves the pages, and stays faded while the apply runs', async () => {
    useStudioStore.setState({ doc: stored() });
    const view = inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    fireEvent.click(choice('Double page 1'));
    expect(repo.select).not.toHaveBeenCalled();
    fireEvent.pointerLeave(pagesArea());
    expect(repo.select).toHaveBeenCalledTimes(1);
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-9', 'sp-7']);
    expect(choice('Double page 1').closest('li')).toHaveClass('opacity-50');

    // The apply runs: no choice any more, the page taken out still faded, nothing sent twice.
    const running = <AssistantChangeCard items={[item('applying', card())]} />;
    view.rerender(
      <AssistantViewContext.Provider value={{ tripId: -3, variant: 'window' }}>{running}</AssistantViewContext.Provider>
    );
    expect(screen.queryByRole('button', { name: /use the new design/ })).toBeNull();
    expect(screen.getByText('Double page 1').closest('li')).toHaveClass('opacity-50');
    expect(screen.getAllByText('Double page 2')[0]?.closest('li')).not.toHaveClass('opacity-50');
    expect(repo.select).toHaveBeenCalledTimes(1);
  });

  it('FE-BOOKDSN-019: an older answer arriving last neither shows nor becomes what a refusal puts back', async () => {
    useStudioStore.setState({ doc: stored() });
    let release: (ids: string[]) => void = () => undefined;
    repo.select
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((resolve) => {
            release = resolve;
          })
      )
      .mockImplementationOnce((_journeyId: number, _designId: string, ids: string[]) => Promise.resolve(ids))
      .mockImplementationOnce(() => Promise.reject(new Error('down')));
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');

    // sp-7 out (its answer held back), then in again (answered at once).
    fireEvent.click(choice('Double page 2', 1));
    fireEvent.pointerLeave(pagesArea());
    fireEvent.click(choice('Double page 2', 1));
    fireEvent.pointerLeave(pagesArea());
    await waitFor(() => expect(repo.select).toHaveBeenCalledTimes(2));
    await act(async () => {
      release(['sp-3', 'sp-9']);
      await Promise.resolve();
    });
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'true');

    // A refused choice puts back the newest answer, sp-7 in.
    fireEvent.click(choice('Double page 2', 0));
    fireEvent.pointerLeave(pagesArea());
    expect(await screen.findByText('The choice of pages could not be saved and was put back.')).toBeInTheDocument();
    expect(choice('Double page 2', 0)).toHaveAttribute('aria-pressed', 'true');
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-BOOKDSN-022: pointing at a page outlines the page of the book it stands for in the rail; a new page outlines none', async () => {
    useStudioStore.setState({ doc: stored() });
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    // sp-3 before and after, the new sp-9, the dropped sp-7.
    const [before, after, added, dropped] = screen.getAllByRole('button', { name: 'Show this page' });
    const hinted = () => useStudioStore.getState().hintSpread;

    // The design's page points at the page it replaces, as the book's own page does.
    fireEvent.pointerEnter(after);
    expect(hinted()).toBe('sp-3');
    fireEvent.pointerLeave(after);
    expect(hinted()).toBeNull();
    fireEvent.pointerEnter(before);
    expect(hinted()).toBe('sp-3');
    fireEvent.pointerLeave(before);
    expect(hinted()).toBeNull();

    // The new page is not in the book yet; the dropped one still is, reached by focus too.
    fireEvent.pointerEnter(added);
    expect(hinted()).toBeNull();
    fireEvent.focus(dropped);
    expect(hinted()).toBe('sp-7');
    fireEvent.blur(dropped);
    expect(hinted()).toBeNull();
  });
});

describe('the whole-book design card: answers, decisions and facts', () => {
  it('FE-BOOKDSN-030: an answer arriving while a newer choice waits leaves that choice shown, and the next press starts from it', async () => {
    useStudioStore.setState({ doc: stored() });
    let release: (ids: string[]) => void = () => undefined;
    repo.select.mockImplementationOnce(
      () =>
        new Promise<string[]>((resolve) => {
          release = resolve;
        })
    );
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');

    // sp-3 out and sent (its answer held back), then sp-7 out while that request is on its way.
    fireEvent.click(choice('Double page 1'));
    fireEvent.pointerLeave(pagesArea());
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-9', 'sp-7']);
    fireEvent.click(choice('Double page 2', 1));
    await act(async () => {
      release(['sp-9', 'sp-7']);
      await Promise.resolve();
    });
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'false');
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'false');

    // The next press starts from what is shown: sp-3 back in, sp-7 still out. The pause may have sent the waiting
    // choice by now or not; no request after the first puts sp-7 back.
    fireEvent.click(choice('Double page 1'));
    fireEvent.pointerLeave(pagesArea());
    const later = repo.select.mock.calls.slice(1).map((call) => call[2] as string[]);
    expect(later.flat()).not.toContain('sp-7');
    expect(repo.select).toHaveBeenLastCalledWith(3, 'd-1', ['sp-3', 'sp-9']);
  });

  it('FE-BOOKDSN-031: a refusal arriving while a newer choice waits, or after a newer request went out, puts nothing back', async () => {
    useStudioStore.setState({ doc: stored() });
    const refusals: ((err: Error) => void)[] = [];
    const held = () =>
      new Promise<string[]>((_resolve, reject) => {
        refusals.push(reject);
      });
    repo.select.mockImplementationOnce(held).mockImplementationOnce(held);
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    const putBack = 'The choice of pages could not be saved and was put back.';

    // sp-3 out and sent, then sp-7 out while that request is on its way; the first request is refused.
    fireEvent.click(choice('Double page 1'));
    fireEvent.pointerLeave(pagesArea());
    fireEvent.click(choice('Double page 2', 1));
    await act(async () => {
      refusals[0]?.(new Error('down'));
      await Promise.resolve();
    });
    expect(screen.queryByText(putBack)).toBeNull();
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'false');
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'false');

    // That choice goes out (refused later), then sp-7 back in, answered at once.
    fireEvent.pointerLeave(pagesArea());
    fireEvent.click(choice('Double page 2', 1));
    fireEvent.pointerLeave(pagesArea());
    expect(repo.select).toHaveBeenCalledTimes(3);
    expect(repo.select).toHaveBeenLastCalledWith(3, 'd-1', ['sp-9', 'sp-7']);
    await act(async () => {
      refusals[1]?.(new Error('down'));
      await Promise.resolve();
    });
    expect(screen.queryByText(putBack)).toBeNull();
    expect(choice('Double page 1')).toHaveAttribute('aria-pressed', 'false');
    expect(choice('Double page 2', 1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-BOOKDSN-032: Apply sends a choice still waiting at once and goes out once it landed; a running row holds nothing', async () => {
    useStudioStore.setState({ doc: stored() });
    useAssistantStore.setState({ byTrip: { [-3]: { ...chatOf(useAssistantStore.getState(), -3), threadId: 9 } } });
    let land: (ids: string[]) => void = () => undefined;
    repo.select.mockImplementationOnce(
      () =>
        new Promise<string[]>((resolve) => {
          land = resolve;
        })
    );
    const decide = vi
      .spyOn(assistantRepo, 'decide')
      .mockImplementation(async () => streamOf([{ type: 'finish', finishReason: 'stop' }]));
    const view = inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');

    // sp-3 out, then Apply straight away: neither the pointer nor the focus left the pages.
    fireEvent.click(choice('Double page 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(repo.select).toHaveBeenCalledTimes(1);
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-9', 'sp-7']);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(decide).not.toHaveBeenCalled();

    // The selection landed: the decision goes out.
    await act(async () => {
      land(['sp-9', 'sp-7']);
      await Promise.resolve();
    });
    await waitFor(() => expect(decide).toHaveBeenCalledTimes(1));
    expect(decide.mock.calls[0]?.[2]).toMatchObject({ decisions: [{ toolCallId: 'w1', approved: true }] });
    await waitFor(() => expect(chatOf(useAssistantStore.getState(), -3).isRunning).toBe(false));

    // The row runs: its pages can no longer be chosen, so it holds no decision back.
    const running = <AssistantChangeCard items={[item('applying', card())]} />;
    view.rerender(
      <AssistantViewContext.Provider value={{ tripId: -3, variant: 'window' }}>{running}</AssistantViewContext.Provider>
    );
    expect(useAssistantStore.getState().decisionHolds[-3]).toEqual([]);
    expect(repo.select).toHaveBeenCalledTimes(1);
  });

  it('FE-BOOKDSN-033: a receipt names a page kept for a photo gone, and draws nothing where it wrote no page', async () => {
    useStudioStore.setState({ doc: designed() });
    const skipped: BookDesignCard['skipped'] = [
      { spreadId: 'sp-3', reason: 'photo_gone' },
      { spreadId: 'sp-9', reason: 'changed_since' },
    ];
    inView(<AssistantChangeCard items={[applied(skipped)]} />);
    expect(screen.getByText('1 page kept, a photo left the gallery')).toBeInTheDocument();
    expect(screen.getByText('1 page changed since, kept as it is')).toBeInTheDocument();
    await act(async () => {
      await import('./BookDesignSpreadStrip');
    });
    expect(screen.queryByRole('list', { name: 'Pages of the design' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
  });

  it('FE-BOOKDSN-034: one typeface for both is named once, and findings with no fault read as a warning', async () => {
    useStudioStore.setState({ doc: stored() });
    const quiet = card().spreads.map((spread) => ({ ...spread, severe: 0 }));
    const held = card({ heading: 'garamond', body: 'garamond', spreads: quiet });
    inView(<AssistantChangeCard items={[item('pending', held)]} />);
    expect(screen.getAllByText('EB Garamond')).toHaveLength(1);
    expect(screen.queryByText(/Playfair/)).toBeNull();
    // The words sit in their badge, whose tone is a warning, not a fault.
    expect(screen.getByText('3 things to check').parentElement).toHaveClass('text-warning');
    expect(await screen.findByText('Before')).toBeInTheDocument();
  });

  it('FE-BOOKDSN-035: an applied design opens the Studio on the first page it wrote, past the ones it left', async () => {
    useStudioStore.setState({ doc: designed() });
    const onOpen = vi.fn();
    const open = () => fireEvent.click(screen.getByRole('button', { name: 'Show in the Studio' }));
    const first = inView(<AssistantChangeCard items={[applied()]} />, { onOpen });
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(2);
    open();
    // The cover was kept as it was: the first page written is the double page laid out again.
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3/studio?page=sp-3' });
    first.unmount();

    const changed: BookDesignCard['skipped'] = [{ spreadId: 'sp-3', reason: 'changed_since' }];
    const second = inView(<AssistantChangeCard items={[applied(changed)]} />, { onOpen });
    open();
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3/studio?page=sp-9' });
    second.unmount();

    // Every page it would write was left as it was: the book opens as it is.
    const all: BookDesignCard['skipped'] = [...changed, { spreadId: 'sp-9', reason: 'photo_gone' }];
    inView(<AssistantChangeCard items={[applied(all)]} />, { onOpen });
    open();
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3/studio' });
  });

  it('FE-BOOKDSN-036: Apply on a card that came back waits for the choice the card before it sent as it went away', async () => {
    useStudioStore.setState({ doc: stored() });
    useAssistantStore.setState({ byTrip: { [-3]: { ...chatOf(useAssistantStore.getState(), -3), threadId: 9 } } });
    let land: (ids: string[]) => void = () => undefined;
    repo.select.mockImplementationOnce(
      () =>
        new Promise<string[]>((resolve) => {
          land = resolve;
        })
    );
    const decide = vi
      .spyOn(assistantRepo, 'decide')
      .mockImplementation(async () => streamOf([{ type: 'finish', finishReason: 'stop' }]));
    const first = inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');

    // sp-3 out, then the card goes away (the window closed): the choice goes out, its answer on its way.
    fireEvent.click(choice('Double page 1'));
    first.unmount();
    expect(repo.select).toHaveBeenCalledWith(3, 'd-1', ['sp-9', 'sp-7']);

    // The card comes back and Apply is pressed before that answer: the decision waits for it.
    inView(<AssistantChangeCard items={[item('pending', card())]} />);
    await screen.findByText('Before');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(decide).not.toHaveBeenCalled();
    // The request the first card sent holds the chat, beside the hold of the card that came back.
    expect(useAssistantStore.getState().decisionHolds[-3]).toHaveLength(2);

    await act(async () => {
      land(['sp-9', 'sp-7']);
      await Promise.resolve();
    });
    await waitFor(() => expect(decide).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(chatOf(useAssistantStore.getState(), -3).isRunning).toBe(false));
    // Landed, that request holds nothing any more; the card that came back sent nothing itself.
    expect(useAssistantStore.getState().decisionHolds[-3]).toHaveLength(1);
    expect(repo.select).toHaveBeenCalledTimes(1);
  });
});
