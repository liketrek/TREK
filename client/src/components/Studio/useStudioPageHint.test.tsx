/**
 * FE-STUDIO-HINT-001 to FE-STUDIO-HINT-003
 *
 * Pointing at a page drawn in a chat card outlines the same page in the
 * Studio's page rail (journey-studio.md 4.2): by pointer or by focus, gone
 * again on leaving, on blur and when the card goes away while it points; a
 * page the open book does not hold outlines nothing, and opening a book
 * clears it. A book change's card points this way from its thumbnails.
 */
import { blankBook, type BookPageCard } from '@trek/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import type { ChangeItem } from '../Assistant/assistantParts';
import { AssistantViewContext } from '../Assistant/assistantViewContext';
import BookPageThumbs from '../Assistant/cards/book/BookPageThumbs';
import { type JourneySource, StudioSidebar } from './StudioSidebar';
import type { StudioUploader } from './studioUpload';
import { useStudioPageHint } from './useStudioPageHint';

const STUDIO = useStudioStore.getState();

const SOURCE: JourneySource = { entries: [], photos: [], photoEntries: {} };
const NO_UPLOAD: StudioUploader = async () => ({ photoIds: [], failed: 0, skippedVideos: 0 });

/** A blank book with readable ids: sp-1 the cover, sp-2 the first page, sp-3 its double page, sp-4 and sp-5. */
function book() {
  let seq = 0;
  return blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
}

/** The page rail of the open book. */
function renderRail() {
  const doc = useStudioStore.getState().doc;
  if (!doc) throw new Error('no book open');
  return render(
    <StudioSidebar
      page={doc.page}
      pxPerMm={96 / 25.4}
      bookView={false}
      source={SOURCE}
      stats={null}
      path={[]}
      t={(k: string) => k}
      locale="en-US"
      canEdit
      onUpload={NO_UPLOAD}
      onToggleStop={async () => true}
    />
  );
}

/** The rail's thumbnails, in the book's order, by whether each is outlined. */
function outlined(): boolean[] {
  return [...document.querySelectorAll('.st-thumb')].map((thumb) => thumb.classList.contains('is-hinted'));
}

/** A page drawn in a card, as the card thumbnails draw one: a button that points at it. */
function CardPage({ spreadId }: { spreadId: string }) {
  const hint = useStudioPageHint(spreadId);
  return (
    <button type="button" {...hint}>
      {`card page ${spreadId}`}
    </button>
  );
}

afterEach(() => {
  useStudioStore.setState(STUDIO, true);
});

describe('useStudioPageHint', () => {
  it('FE-STUDIO-HINT-001: pointing at a card page outlines that page in the rail, leaving takes it off', () => {
    act(() => useStudioStore.getState().load(book()));
    renderRail();
    render(<CardPage spreadId="sp-3" />);
    const page = screen.getByRole('button', { name: 'card page sp-3' });
    expect(outlined()).toEqual([false, false, false, false, false]);

    fireEvent.pointerEnter(page);
    expect(useStudioStore.getState().hintSpread).toBe('sp-3');
    expect(outlined()).toEqual([false, false, true, false, false]);
    fireEvent.pointerLeave(page);
    expect(outlined()).toEqual([false, false, false, false, false]);

    // The keyboard points the same way.
    fireEvent.focus(page);
    expect(useStudioStore.getState().hintSpread).toBe('sp-3');
    fireEvent.blur(page);
    expect(useStudioStore.getState().hintSpread).toBeNull();
  });

  it('FE-STUDIO-HINT-002: a page the book lacks outlines nothing; a card gone or a book opened clears it', () => {
    act(() => useStudioStore.getState().load(book()));
    render(<CardPage spreadId="sp-new" />);
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'card page sp-new' }));
    expect(useStudioStore.getState().hintSpread).toBeNull();

    const card = render(<CardPage spreadId="sp-4" />);
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'card page sp-4' }));
    expect(useStudioStore.getState().hintSpread).toBe('sp-4');
    card.unmount();
    expect(useStudioStore.getState().hintSpread).toBeNull();

    // A card going away that points at no page leaves another card's outline alone.
    const other = render(<CardPage spreadId="sp-2" />);
    act(() => useStudioStore.getState().setHintSpread('sp-5'));
    other.unmount();
    expect(useStudioStore.getState().hintSpread).toBe('sp-5');
    act(() => useStudioStore.getState().load(book()));
    expect(useStudioStore.getState().hintSpread).toBeNull();
  });

  it("FE-STUDIO-HINT-003: a book change's thumbnail points at its page in the Studio's rail", () => {
    act(() => useStudioStore.getState().load(book()));
    renderRail();
    const card = {
      kind: 'bookPage',
      journeyId: 3,
      change: 'changed',
      pages: [{ spreadId: 'sp-3', index: 2, role: 'inner', number: 1, photos: 0 }],
      ops: [],
      cover: null,
    } as unknown as BookPageCard;
    const item = { state: 'applied' } as ChangeItem;
    render(
      <AssistantViewContext.Provider value={{ tripId: -3, variant: 'window' }}>
        <BookPageThumbs card={card} item={item} />
      </AssistantViewContext.Provider>
    );

    const thumb = screen.getByRole('button', { name: 'Show this page' });
    fireEvent.pointerEnter(thumb);
    expect(outlined()).toEqual([false, false, true, false, false]);
    fireEvent.pointerLeave(thumb);
    expect(outlined()).toEqual([false, false, false, false, false]);
  });
});
