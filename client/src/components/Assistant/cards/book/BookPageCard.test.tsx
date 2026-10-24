/**
 * FE-AI-BOOKPAGE-001 to FE-AI-BOOKPAGE-007
 *
 * The photo book's change rows in the Studio's chat: the pages a change works
 * on named as the Studio names them, its facts as badges (new pages, where a
 * moved page lands, the layout, new photos, findings to check), the page
 * before and after drawn from the book open in the Studio (each page of a
 * delete alone, the page after as the server made it when the card carries
 * it and the book is still at the trial's version), a thumbnail that shows
 * its page, each finding named once, a receipt that opens the Studio on the
 * page, and a discarded change struck through with no page drawn.
 */
import {
  type AssistantApplied,
  type AssistantChangePreview,
  blankBook,
  blankSpread,
  type BookPageCard,
  bookTextElementSchema,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useStudioStore } from '../../../../store/studioStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';

const STUDIO = useStudioStore.getState();

/** A blank book with readable ids: sp-1 the cover, sp-2 the first page, sp-3 its double page, sp-4 and sp-5. */
function book() {
  let seq = 0;
  return blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
}

function card(over: Partial<BookPageCard> = {}): BookPageCard {
  return {
    kind: 'bookPage',
    journeyId: 3,
    change: 'changed',
    baseVersion: 4,
    pages: [{ spreadId: 'sp-3', index: 2, role: 'inner', number: 1, photos: 0 }],
    count: 0,
    movedTo: null,
    ops: [{ op: 'layout', template: 'two-up' }],
    cover: null,
    layout: { kind: 'template', id: 'two-up', name: null },
    photosAdded: 2,
    findings: [
      { code: 'empty_frame', severity: 'severe' },
      { code: 'empty_frame', severity: 'severe' },
      { code: 'parked', severity: 'info' },
    ],
    moreFindings: 1,
    ...over,
  };
}

function item(state: ChangeItem['state'], held: BookPageCard, verbKey: AssistantChangePreview['verbKey']): ChangeItem {
  const preview: AssistantChangePreview = {
    toolCallId: 'w1',
    verbKey,
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

/** The chat of journey 3's Studio (its key is the negated journey id), the book every card here is about. */
function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: -3, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

afterEach(() => {
  useStudioStore.setState(STUDIO, true);
  vi.restoreAllMocks();
});

describe('the book page card', () => {
  it('FE-AI-BOOKPAGE-001: a waiting edit names its page and facts, and draws the page before and after from the Studio', async () => {
    useStudioStore.setState({ doc: book(), activeSpread: 0 });
    inView(<AssistantChangeCard items={[item('pending', card(), 'editBookPage')]} />);
    expect(screen.getByText('Double page 1')).toBeInTheDocument();
    expect(screen.getByText('Change the page')).toBeInTheDocument();
    expect(screen.getByText('Two full pages')).toBeInTheDocument();
    expect(screen.getByText('+2 photos')).toBeInTheDocument();
    // Two faults and one more past the card; the parked element is context, not counted.
    expect(screen.getByText('3 things to check')).toBeInTheDocument();
    expect(screen.getAllByText('An empty photo frame')).toHaveLength(1);
    expect(screen.getByText('Parked elements')).toBeInTheDocument();

    expect(await screen.findByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    const thumbs = screen.getAllByRole('button', { name: 'Show this page' });
    expect(thumbs).toHaveLength(2);
    // The page after holds the two frames of the layout; the page before is blank.
    const sheets = thumbs.map((thumb) => thumb.querySelectorAll('div').length);
    expect(sheets[1]).toBeGreaterThan(sheets[0] ?? 0);
    fireEvent.click(thumbs[1] as HTMLElement);
    expect(useStudioStore.getState().activeSpread).toBe(2);
  });

  it('FE-AI-BOOKPAGE-002: a cover change draws the cover after it; a new book names itself and its pages, drawn by none', async () => {
    useStudioStore.setState({ doc: book() });
    const cover = card({
      pages: [{ spreadId: 'sp-1', index: 0, role: 'cover', number: null, photos: 0 }],
      ops: [],
      cover: { template: 'cover-full', photoId: null, title: 'Portugal', subtitle: null },
      layout: { kind: 'template', id: 'cover-full', name: null },
      photosAdded: 0,
      findings: [],
      moreFindings: 0,
    });
    const first = inView(<AssistantChangeCard items={[item('pending', cover, 'setBookCover')]} />);
    expect(screen.getByText('Cover')).toBeInTheDocument();
    expect(screen.getByText('Change the cover')).toBeInTheDocument();
    expect(screen.getByText('Full bleed')).toBeInTheDocument();
    expect(await screen.findByText('After')).toBeInTheDocument();
    expect(screen.queryByText(/things? to check/)).toBeNull();
    first.unmount();

    const fresh = card({ change: 'new', baseVersion: null, pages: [], count: 5, ops: [], layout: null });
    const quiet = { ...fresh, photosAdded: 0, findings: [], moreFindings: 0 };
    inView(<AssistantChangeCard items={[item('pending', quiet, 'createBook')]} />);
    expect(screen.getByText('New photo book')).toBeInTheDocument();
    expect(screen.getByText('5 new pages')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
  });

  it('FE-AI-BOOKPAGE-003: a move names where the page lands; a delete names every page it takes, each drawn alone', async () => {
    useStudioStore.setState({ doc: book() });
    const moved = card({ change: 'moved', movedTo: 3, ops: [], layout: null, photosAdded: 0, findings: [] });
    const quiet = { ...moved, moreFindings: 0 };
    const first = inView(<AssistantChangeCard items={[item('pending', quiet, 'moveBookPage')]} />);
    expect(screen.getAllByText('Double page 1')[0]).toBeInTheDocument();
    expect(screen.getByText('Double page 3')).toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(1);
    expect(screen.queryByText('Before')).toBeNull();
    first.unmount();

    const pages = [
      { spreadId: 'sp-3', index: 2, role: 'inner' as const, number: 1, photos: 0 },
      { spreadId: 'sp-9', index: 3, role: 'inner' as const, number: 2, photos: 1 },
    ];
    const gone = card({ change: 'willDelete', pages, count: 2, ops: [], layout: null, photosAdded: 0, findings: [] });
    // The book holds a second double page (sp-9) after sp-3.
    const doc = book();
    const two = {
      ...doc,
      spreads: [...doc.spreads.slice(0, 3), blankSpread('inner', () => 'sp-9'), ...doc.spreads.slice(3)],
    };
    useStudioStore.setState({ doc: two, activeSpread: 0 });
    inView(<AssistantChangeCard items={[item('pending', { ...gone, moreFindings: 0 }, 'removeBookPages')]} />);
    expect(screen.getByText('Double page 1, Double page 2')).toBeInTheDocument();
    expect(screen.getByText('Delete pages from the book')).toBeInTheDocument();
    const thumbs = await screen.findAllByRole('button', { name: 'Show this page' });
    expect(thumbs).toHaveLength(2);
    expect(screen.queryByText('Before')).toBeNull();
    fireEvent.click(thumbs[1] as HTMLElement);
    expect(useStudioStore.getState().activeSpread).toBe(3);
  });

  it('FE-AI-BOOKPAGE-004: a receipt shows the page as it is now and opens the Studio on it; a deleted page opens the book', async () => {
    useStudioStore.setState({ doc: book() });
    const onOpen = vi.fn();
    const first = inView(<AssistantChangeCard items={[item('applied', card(), 'editBookPage')]} />, { onOpen });
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(1);
    expect(screen.queryByText('After')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show in the Studio' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/journey/3/studio?page=sp-3' });
    first.unmount();

    const gone = card({ change: 'willDelete', ops: [], layout: null, findings: [], moreFindings: 0 });
    inView(<AssistantChangeCard items={[item('applied', gone, 'removeBookPages')]} />, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Show in the Studio' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3/studio' });
  });

  it('FE-AI-BOOKPAGE-005: outside the Studio, or on another book, the card keeps its facts and draws no page', async () => {
    const first = inView(<AssistantChangeCard items={[item('pending', card(), 'editBookPage')]} />);
    expect(screen.getByText('Double page 1')).toBeInTheDocument();
    expect(screen.getByText('3 things to check')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
    first.unmount();

    // The Studio holds a book, but the chat is another journey's or a trip's: that book may not be this card's.
    useStudioStore.setState({ doc: book() });
    const pending = <AssistantChangeCard items={[item('pending', card(), 'editBookPage')]} />;
    // The control first, which also loads the lazy thumbnails: journey 3's own chat draws the page before and after.
    const own = inView(pending);
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(2);
    own.unmount();
    const drawsIn = async (tripId: number) => {
      const other = inView(pending, { tripId });
      expect(screen.getByText('Double page 1')).toBeInTheDocument();
      await act(async () => {
        await import('./BookPageThumbs');
      });
      const drawn = screen.queryAllByRole('button', { name: 'Show this page' }).length;
      other.unmount();
      return drawn;
    };
    expect(await drawsIn(-9)).toBe(0);
    expect(await drawsIn(4)).toBe(0);
  });

  it('FE-AI-BOOKPAGE-006: a discarded edit is struck through and draws no page; a warning with no fault reads as a warning', async () => {
    useStudioStore.setState({ doc: book() });
    const warned = card({ findings: [{ code: 'low_dpi', severity: 'warn' }], moreFindings: 0 });
    inView(<AssistantChangeCard items={[item('discarded', warned, 'editBookPage')]} />);
    expect(screen.getByText('Double page 1')).toHaveClass('line-through');
    // The words sit in their badge, whose tone is a warning, not a fault.
    expect(screen.getByText('1 thing to check').parentElement).toHaveClass('text-warning');
    await act(async () => {
      await import('./BookPageThumbs');
    });
    expect(screen.queryByRole('button', { name: 'Show this page' })).toBeNull();
  });

  it('FE-AI-BOOKPAGE-007: a waiting edit draws the page after as the server made it, where the Studio alone could not run it, until the book moves on', async () => {
    useStudioStore.setState({ doc: book(), activeSpread: 0 });
    // A caption the book on screen cannot word: run in the Studio it comes to nothing, so only the page before shows.
    const caption = card({ ops: [{ op: 'caption', photoElementId: 'p-81' }] });
    const first = inView(<AssistantChangeCard items={[item('pending', caption, 'editBookPage')]} />);
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(1);
    expect(screen.queryByText('After')).toBeNull();
    first.unmount();

    // The page the server's trial made, its caption worded from the journey, is drawn after it.
    const words = bookTextElementSchema.parse({
      id: 't-cap',
      kind: 'text',
      frame: { x: 20, y: 150, w: 120, h: 8 },
      text: 'Tram 28 at dawn',
    });
    const made = { ...blankSpread('inner', () => 'sp-3'), elements: [words] };
    const drawn = item('pending', { ...caption, after: made }, 'editBookPage');
    const second = inView(<AssistantChangeCard items={[drawn]} />, { bookVersion: 4 });
    expect(await screen.findByText('After')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('Tram 28 at dawn')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Show this page' })).toHaveLength(2);
    second.unmount();

    // The book moved on since the trial (another change applied, a save): its page is not what the change would leave.
    inView(<AssistantChangeCard items={[drawn]} />, { bookVersion: 5 });
    expect(await screen.findAllByRole('button', { name: 'Show this page' })).toHaveLength(1);
    expect(screen.queryByText('After')).toBeNull();
    expect(screen.queryByText('Tram 28 at dawn')).toBeNull();
  });
});
