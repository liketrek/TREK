import { act, renderHook } from '@testing-library/react';
import type { BookDocument, BookElement, BookTheme } from '@trek/shared';
import { bookPageSetupSchema, bookTextElementSchema, bookThemeOf } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioThemeLink } from '../../../src/components/Studio/theme/StudioThemeLink';
import { StudioThemePanel } from '../../../src/components/Studio/theme/StudioThemePanel';
import * as photoColours from '../../../src/components/Studio/theme/themePhotoColours';
import { isEdited, themeRequest, useStudioTheme } from '../../../src/components/Studio/theme/useStudioTheme';
import { useStudioStore } from '../../../src/store/studioStore';
import { fireEvent, render, screen } from '../../helpers/render';

vi.mock('../../../src/components/Studio/theme/themePhotoColours', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/components/Studio/theme/themePhotoColours')>()),
  readPhotoSwatches: vi.fn(async () => []),
}));

/**
 * The Theme panel and the inspector's theme colours (WP7): a draft that
 * changes nothing until it is applied, an apply through the one engine the
 * assistant uses, and links that a colour picked by hand takes away.
 */

const FRAME = { x: 20, y: 30, w: 60, h: 40 };
const t = (k: string) => k;

const text = (over: Record<string, unknown> = {}): BookElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: FRAME,
    text: 'Harbour',
    color: '#1a1a1a',
    ...over,
  }) as BookElement;

function load(elements: BookElement[] = [text()], extra: Partial<BookDocument> = {}) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page: bookPageSetupSchema.parse({}),
    spreads: [
      { id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null },
      { id: 'sp2', role: 'inner', background: null, elements: [text({ id: 't2' })], parked: [], entryId: null },
    ],
    ...extra,
  } as BookDocument);
  useStudioStore.getState().setReadOnly(false);
}

const doc = () => useStudioStore.getState().doc as BookDocument;
const toast = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('../../../src/components/shared/Toast', () => ({ useToast: () => toast }));

beforeEach(() => {
  load();
  vi.clearAllMocks();
});

describe('the theme draft', () => {
  it('FE-STUDIO-THEME-001: starts on the first theme, or on the book own one', () => {
    const { result } = renderHook(() => useStudioTheme());
    expect(result.current.draft.id).toBe('poster-pop');
    expect(result.current.current).toBeUndefined();
    load([text()], { theme: bookThemeOf('nordic') });
    const again = renderHook(() => useStudioTheme());
    expect(again.result.current.draft.id).toBe('nordic');
  });

  it('FE-STUDIO-THEME-002: picks, recolours, sets faces, motifs and decoration, and resets an edited theme', () => {
    const { result } = renderHook(() => useStudioTheme());
    act(() => result.current.pick('alpine'));
    expect(result.current.edited).toBe(false);
    act(() => result.current.setColour('accent', '#ff0000'));
    act(() => result.current.setFont('heading', 'playfair', 700));
    act(() => result.current.setFont('script', null));
    act(() => result.current.setFont('body', null));
    act(() => result.current.toggleMotif('sea'));
    act(() => result.current.toggleMotif('mountains'));
    act(() => result.current.setDecoration('rich'));
    const d = result.current.draft;
    expect([d.palette.accent, d.fonts.heading, d.fonts.script, d.motifs, d.decoration]).toEqual([
      '#ff0000',
      { font: 'playfair', weight: 700 },
      null,
      ['sea'],
      'rich',
    ]);
    expect(d.fonts.body).toEqual(bookThemeOf('alpine').fonts.body);
    expect(result.current.edited).toBe(true);
    act(() => result.current.reset());
    expect(result.current.draft).toEqual(bookThemeOf('alpine'));
    // Nothing reached the book.
    expect(doc().theme).toBeUndefined();
  });

  it('FE-STUDIO-THEME-003: builds the whole request, and calls a theme of the book own never edited', () => {
    const theme = { ...bookThemeOf('cutout'), id: null };
    expect(themeRequest(theme, ['sp1'], false)).toMatchObject({ spreadIds: ['sp1'], adopt: false });
    expect(themeRequest(theme, undefined, true)).not.toHaveProperty('theme');
    expect(themeRequest(bookThemeOf('cutout'), undefined, true)).toMatchObject({ theme: 'cutout' });
    expect(isEdited(theme)).toBe(false);
  });
});

describe('the draft and saves from elsewhere', () => {
  it('FE-STUDIO-THEME-012: keeps colours being tried when the same theme is read anew, follows another', () => {
    load([text()], { theme: bookThemeOf('nordic') });
    const { result } = renderHook(() => useStudioTheme());
    act(() => result.current.setColour('accent', '#ff0000'));

    // Another editor saved a page: the book comes back parsed again, its theme the same in new objects and key order.
    const before = doc().theme as BookTheme;
    const reread = Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(before)) as BookTheme).reverse());
    act(() => useStudioStore.setState({ doc: { ...doc(), theme: reread as BookTheme } }));
    expect(result.current.draft.palette.accent).toBe('#ff0000');

    act(() => useStudioStore.setState({ doc: { ...doc(), theme: bookThemeOf('alpine') } }));
    expect(result.current.draft.id).toBe('alpine');
    expect(result.current.draft.palette).toEqual(bookThemeOf('alpine').palette);
  });
});

describe('applying a theme', () => {
  it('FE-STUDIO-THEME-004: to the book adopts and recolours every page in one undo step', () => {
    const { result } = renderHook(() => useStudioTheme());
    act(() => result.current.pick('tropical'));
    let done: ReturnType<typeof result.current.apply> = null;
    act(() => {
      done = result.current.apply('book');
    });
    expect(done).toEqual({ pages: 2 });
    const tropical = bookThemeOf('tropical');
    expect(doc().theme?.id).toBe('tropical');
    expect(doc().spreads.map((s) => s.background)).toEqual([tropical.palette.paper, tropical.palette.paper]);
    expect(doc().spreads[0]?.elements[0]).toMatchObject({ token: 'ink', color: tropical.palette.ink });
    act(() => useStudioStore.getState().undo());
    expect(doc().theme).toBeUndefined();
  });

  it('FE-STUDIO-THEME-005: to the page open, without adopting when told, and never in a read-only book', () => {
    const { result } = renderHook(() => useStudioTheme());
    act(() => result.current.setAdopt(false));
    let done: ReturnType<typeof result.current.apply> = null;
    act(() => {
      done = result.current.apply('page');
    });
    expect(done).toEqual({ pages: 0 });
    expect(doc().theme?.id).toBe('poster-pop');
    act(() => result.current.setAdopt(true));
    act(() => {
      done = result.current.apply('page');
    });
    expect(done).toEqual({ pages: 1 });
    expect(doc().spreads[1]?.background).toBeNull();
    act(() => useStudioStore.getState().setReadOnly(true));
    const readOnly = renderHook(() => useStudioTheme());
    expect(readOnly.result.current.canApply).toBe(false);
    expect(readOnly.result.current.apply('book')).toBeNull();
  });

  it('FE-STUDIO-THEME-006: takes the accents from the photos, or says the photos have none', async () => {
    const read = vi.mocked(photoColours.readPhotoSwatches);
    load([{ id: 'p1', kind: 'photo', frame: FRAME, photoId: 5 } as unknown as BookElement]);
    const { result } = renderHook(() => useStudioTheme());
    expect(result.current.hasPhotos).toBe(true);
    read.mockResolvedValueOnce([{ hex: '#1f6fbf', share: 1 }]);
    let found = false;
    await act(async () => {
      found = await result.current.fromPhotos();
    });
    expect(found).toBe(true);
    expect(result.current.draft.palette.accent).toBe('#1f6fbf');
    read.mockResolvedValueOnce([{ hex: '#808080', share: 1 }]);
    await act(async () => {
      found = await result.current.fromPhotos();
    });
    expect(found).toBe(false);
  });
});

describe('the Theme panel', () => {
  it('FE-STUDIO-THEME-007: shows twelve themes, applies the one picked and says so', () => {
    render(<StudioThemePanel t={t} />);
    const cards = screen
      .getAllByRole('button', { pressed: false })
      .filter((b) => b.classList.contains('st-theme-card'));
    expect(cards).toHaveLength(11);
    fireEvent.click(screen.getByTitle('studio.theme.descr.riviera'));
    fireEvent.click(screen.getByText('studio.theme.applyBook'));
    expect(doc().theme?.id).toBe('riviera');
    expect(toast.success).toHaveBeenCalledWith('studio.theme.applied');
    expect(screen.getByLabelText('studio.theme.inUse')).toBeTruthy();
  });

  it('FE-STUDIO-THEME-008: edits a colour and a face, and says when nothing followed the theme', () => {
    render(<StudioThemePanel t={t} />);
    fireEvent.change(screen.getByLabelText('studio.theme.token.accent'), { target: { value: '#00aa00' } });
    // The script switched off says so, and back on it is a face again.
    fireEvent.click(screen.getByLabelText('studio.theme.slot.script'));
    expect(screen.getByText('studio.theme.noScript')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('studio.theme.slot.script'));
    expect(screen.queryByText('studio.theme.noScript')).toBeNull();
    fireEvent.click(screen.getByText('studio.theme.reset'));
    fireEvent.click(screen.getByLabelText('studio.theme.adopt'));
    fireEvent.click(screen.getByText('studio.theme.applyPage'));
    expect(toast.info).toHaveBeenCalledWith('studio.theme.nothing');
  });
});

describe('the inspector theme colours', () => {
  it('FE-STUDIO-THEME-009: show nothing without a theme, link a colour and take the link away', () => {
    const onLink = vi.fn();
    const onUnlink = vi.fn();
    const { container, rerender } = render(
      <StudioThemeLink theme={undefined} token={undefined} onLink={onLink} onUnlink={onUnlink} t={t} />
    );
    expect(container.querySelector('.st-theme-link')).toBeNull();
    const nordic = bookThemeOf('nordic');
    rerender(<StudioThemeLink theme={nordic} token="accent" onLink={onLink} onUnlink={onUnlink} t={t} />);
    fireEvent.click(screen.getByLabelText('studio.theme.token.accent2'));
    expect(onLink).toHaveBeenCalledWith('accent2', nordic.palette.accent2);
    fireEvent.click(screen.getByLabelText('studio.theme.unlink'));
    expect(onUnlink).toHaveBeenCalled();
  });

  it('FE-STUDIO-THEME-010: a colour picked by hand in the store stops following the theme', () => {
    load([text({ token: 'accent' })], { theme: bookThemeOf('nordic') });
    useStudioStore.getState().updateElement(0, 't1', { color: '#123456' } as Partial<BookElement>);
    expect(doc().spreads[0]?.elements[0]).not.toHaveProperty('token');
    useStudioStore.getState().updateElement(0, 't1', { token: 'accent2' } as Partial<BookElement>);
    expect(doc().spreads[0]?.elements[0]).toMatchObject({ color: bookThemeOf('nordic').palette.accent2 });
  });
});

describe('the colours of the photos', () => {
  it('FE-STUDIO-THEME-011: are the fullest buckets of a sample, and the book photos each once', () => {
    const px = [255, 0, 0, 255, 250, 2, 2, 255, 0, 0, 255, 255, 9, 9, 9, 0];
    const swatches = photoColours.swatchesFromPixels(px);
    expect(swatches[0]).toEqual({ hex: '#fd0101', share: 2 / 3 });
    expect(swatches).toHaveLength(2);
    expect(photoColours.swatchesFromPixels([0, 0, 0, 0])).toEqual([]);
    load([
      { id: 'a', kind: 'photo', frame: FRAME, photoId: 4 } as unknown as BookElement,
      { id: 'b', kind: 'photo', frame: FRAME, photoId: 4 } as unknown as BookElement,
      { id: 'c', kind: 'photo', frame: FRAME, photoId: null } as unknown as BookElement,
    ]);
    expect(photoColours.bookPhotoIds(doc())).toEqual([4]);
    expect(photoColours.bookPhotoIds(null)).toEqual([]);
  });
});
