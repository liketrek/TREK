/**
 * FE-STUDIO-AST-001 to FE-STUDIO-AST-007
 *
 * What TREK Studio does for its assistant (journey-studio.md 3.1, 4.5): it
 * hosts the journey's chat while the column shows; it draws the page a turn
 * asks for off screen, with other members' photos as empty frames, and sends
 * it at the version the turn named; a page of a design draft comes from the
 * draft; a preview draws the page the server applied, nothing saved; each
 * question carries the page on screen; `?page=` shows a page. The snapshot
 * and the repo are faked: a real browser draws the page in the Playwright flows.
 */
import {
  type AiStatusResponse,
  type AssistantPageRender,
  blankBook,
  type BookDocument,
  bookPhotoElementSchema,
} from '@trek/shared';
import { useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { assistantRepo } from '../../repo/assistantRepo';
import { assistantChatKey } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useStudioStore } from '../../store/studioStore';
import { StudioPageStage } from './StudioAssistantPanel';
import { snapshotSpread } from './pageSnapshot';
import { renderJobOf, useStudioAssistant } from './useStudioAssistant';

vi.mock('./pageSnapshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./pageSnapshot')>()),
  snapshotSpread: vi.fn(),
}));

const JOURNEY = 12;
const KEY = assistantChatKey({ kind: 'journey', journeyId: JOURNEY });

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'openai', model: 'gpt', host: 'api.openai.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'openai', model: 'gpt', host: 'api.openai.com' },
  quota: null,
  privacyAcked: true,
  studioImagesAcked: true,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

const REQUEST: AssistantPageRender = {
  requestId: '5f0c3a52-8d1e-4b7a-9c2f-0a1b2c3d4e5f',
  threadId: 9,
  spreadId: 'sp-3',
  bookVersion: 4,
  hiddenPhotoIds: [31],
};

/** A blank book (sp-1 to sp-5) with an own photo and another member's on the inner spread sp-3. */
function book(): BookDocument {
  let seq = 0;
  const doc = blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
  const own = bookPhotoElementSchema.parse({
    id: 'p-own',
    kind: 'photo',
    frame: { x: 10, y: 10, w: 80, h: 60 },
    photoId: 7,
  });
  const theirs = bookPhotoElementSchema.parse({
    id: 'p-theirs',
    kind: 'photo',
    frame: { x: 230, y: 10, w: 80, h: 60 },
    photoId: 31,
  });
  return { ...doc, spreads: doc.spreads.map((s) => (s.id === 'sp-3' ? { ...s, elements: [own, theirs] } : s)) };
}

function record(version: number) {
  return { id: 1, journeyId: JOURNEY, title: 'Lisbon', version, updatedAt: null, updatedBy: null, document: book() };
}

function Location() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function Harness({ flush }: { flush: () => Promise<boolean> }) {
  const assistant = useStudioAssistant({ journeyId: JOURNEY, flush });
  return (
    <>
      <button type="button" onClick={assistant.toggle}>
        {assistant.open ? 'close' : 'open'}
      </button>
      <StudioPageStage assistant={assistant} />
      <Location />
    </>
  );
}

const flush = vi.fn(async () => true);
const host = () => useAssistantStore.getState().studioHosts[KEY];

beforeEach(() => {
  window.localStorage.setItem('trek.studioAssistant', '1');
  useAssistantStore.setState({ status: STATUS, byTrip: {}, studioHosts: {} });
  useStudioStore.setState({ doc: null, selection: [], activeSpread: 0 });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(snapshotSpread).mockReset();
  window.localStorage.clear();
});

describe('useStudioAssistant', () => {
  it('FE-STUDIO-AST-001: hosts the chat while the column shows, remembered, never without an assistant', async () => {
    render(<Harness flush={flush} />);
    expect(host()).toBeDefined();
    await act(async () => {
      await host()?.flush();
    });
    expect(flush).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(host()).toBeUndefined();
    expect(window.localStorage.getItem('trek.studioAssistant')).toBe('0');

    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(host()).toBeDefined();
    act(() => useAssistantStore.setState({ status: { ...STATUS, available: false } }));
    expect(host()).toBeUndefined();
  });

  it('FE-STUDIO-AST-002: draws the page asked for with other members photos left empty, and sends it', async () => {
    vi.spyOn(assistantRepo, 'pageBook').mockResolvedValueOnce(record(4));
    const upload = vi.spyOn(assistantRepo, 'uploadRender').mockResolvedValueOnce(undefined);
    const image = new Blob(['jpeg'], { type: 'image/jpeg' });
    let drawnSheet: HTMLElement | null = null;
    vi.mocked(snapshotSpread).mockImplementationOnce(async (sheet) => {
      drawnSheet = sheet;
      return { image, width: 1280, height: 640, drawnPhotoIds: [7] };
    });
    const { container } = render(<Harness flush={flush} />);

    act(() => host()?.render(REQUEST, new AbortController().signal));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload.mock.calls[0]?.slice(0, 4)).toEqual([
      JOURNEY,
      9,
      REQUEST.requestId,
      { image, bookVersion: 4, spreadId: 'sp-3', drawnPhotoIds: [7] },
    ]);
    const sheet = drawnSheet as HTMLElement | null;
    expect(sheet?.querySelector('img[src="/api/photos/7/thumbnail"]')).not.toBeNull();
    expect(sheet?.querySelector('img[src*="/api/photos/31/"]')).toBeNull();
    // The stage empties once the page is sent.
    await waitFor(() => expect(container.querySelector('.st-assistant-stage')).toBeNull());
  });

  it('FE-STUDIO-AST-003: a book that moved on past the version asked for is not drawn or sent', async () => {
    vi.spyOn(assistantRepo, 'pageBook').mockResolvedValueOnce(record(5));
    const upload = vi.spyOn(assistantRepo, 'uploadRender');
    render(<Harness flush={flush} />);

    await act(async () => {
      host()?.render(REQUEST, new AbortController().signal);
      await Promise.resolve();
    });

    expect(assistantRepo.pageBook).toHaveBeenCalledWith(JOURNEY);
    expect(snapshotSpread).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('FE-STUDIO-AST-007: a page of a design draft is drawn from the draft, never from the book', async () => {
    const draft = book();
    const designed = {
      ...draft,
      spreads: draft.spreads.map((s) => (s.id === 'sp-3' ? { ...s, background: '#abcdef' } : s)),
    };
    const fromDraft = vi.spyOn(assistantRepo, 'pageDraft').mockResolvedValueOnce({ version: 4, document: designed });
    const fromBook = vi.spyOn(assistantRepo, 'pageBook');
    const upload = vi.spyOn(assistantRepo, 'uploadRender').mockResolvedValueOnce(undefined);
    let background = '';
    vi.mocked(snapshotSpread).mockImplementationOnce(async (sheet) => {
      background = (sheet.firstElementChild as HTMLElement | null)?.style.background ?? '';
      return { image: new Blob(['jpeg']), width: 1280, height: 640, drawnPhotoIds: [7] };
    });
    render(<Harness flush={flush} />);

    act(() => host()?.render({ ...REQUEST, designId: 'd-1' }, new AbortController().signal));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(fromDraft).toHaveBeenCalledWith(JOURNEY, 'd-1');
    expect(fromBook).not.toHaveBeenCalled();
    // The draft's background, however the DOM spells the colour back.
    expect(background).toMatch(/#abcdef|171, 205, 239/i);
  });

  it('FE-STUDIO-AST-004: a preview draws the page the server applied, the stored book untouched', () => {
    const doc = book();
    const deadline = { signal: new AbortController().signal, release: vi.fn() };
    const stored = doc.spreads[2];
    if (!stored) throw new Error('no inner spread');

    const job = renderJobOf(doc, { ...REQUEST, spread: { ...stored, background: '#123456' } }, deadline);

    expect(job?.spread.background).toBe('#123456');
    expect(job?.page).toBe(doc.page);
    expect(job?.folios.length).toBeGreaterThan(0);
    expect([...(job?.hidden ?? [])]).toEqual([31]);
    expect(doc.spreads[2]?.background).toBeNull();
    // Without a proposal the page is drawn as the book holds it; a page the book lacks is not drawn.
    expect(renderJobOf(doc, REQUEST, deadline)?.spread).toBe(stored);
    expect(renderJobOf(doc, { ...REQUEST, spreadId: 'sp-99' }, deadline)).toBeNull();
    // A page sent for another spread is never drawn in this one's place.
    const other: AssistantPageRender = { ...REQUEST, spread: { ...stored, id: 'sp-4', background: '#654321' } };
    expect(renderJobOf(doc, other, deadline)?.spread).toBe(stored);
  });

  it('FE-STUDIO-AST-005: each question carries the page on screen and the elements selected on it', () => {
    act(() => {
      useStudioStore.getState().load(book());
      useStudioStore.getState().setActiveSpread(2);
      useStudioStore.getState().select(['p-own', 'not an id!']);
    });
    render(<Harness flush={flush} />);

    expect(chatOf(useAssistantStore.getState(), KEY).focus).toEqual({ spreadId: 'sp-3', elementIds: ['p-own'] });

    act(() => useStudioStore.getState().select([]));
    expect(chatOf(useAssistantStore.getState(), KEY).focus).toEqual({ spreadId: 'sp-3' });
  });

  it('FE-STUDIO-AST-006: ?page= shows that page and leaves the address', async () => {
    act(() => useStudioStore.getState().load(book()));
    render(<Harness flush={flush} />, { initialEntries: ['/journey/12/studio?page=sp-4'] });

    await waitFor(() => expect(useStudioStore.getState().activeSpread).toBe(3));
    await waitFor(() => expect(screen.getByTestId('search').textContent).toBe(''));
  });
});
