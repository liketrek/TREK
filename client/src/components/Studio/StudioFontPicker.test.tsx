import { blankBook, bookTextElementSchema, type BookDocument, type BookElement, type BookSpread } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { BOOK_FONT_ORDER } from './bookFonts';
import { matchFonts, pickFont } from './fontPicker';
import { StudioFontPicker } from './StudioFontPicker';

/**
 * The typeface picker (FE-STUDIO-FONTPICK): the current family set in itself,
 * a list grouped by kind with every family in its own face, the book's own
 * families first, a search, and a weight that lands on one the family has.
 */

const t = (k: string, params?: Record<string, string | number>) =>
  params ? `${k} ${Object.values(params).join(' ')}` : k;
const groupName = (c: string) => `journey.studio.fonts.cat.${c}`;

const frame = { x: 10, y: 10, w: 80, h: 20 };
function bookIn(...fonts: string[]): BookDocument {
  const doc = blankBook({ title: 'Porto', newId: (p) => `${p}-x` });
  const elements = fonts.map(
    (font, i) => bookTextElementSchema.parse({ id: `t${i}`, kind: 'text', frame, text: 'Porto', font }) as BookElement
  );
  const [cover, ...rest] = doc.spreads as [BookSpread, ...BookSpread[]];
  return {
    ...doc,
    page: { ...doc.page, pageNumbers: { ...doc.page.pageNumbers, show: false } },
    spreads: [{ ...cover, elements }, ...rest],
  };
}

const open = () => fireEvent.click(screen.getByRole('button', { name: /journey\.studio\.fonts\.change/ }));

afterEach(() => {
  useStudioStore.setState({ doc: null });
});

describe('choosing a family', () => {
  it('FE-STUDIO-FONTPICK-001: moves the weight onto one the new family has', () => {
    expect(pickFont('anton', 700)).toEqual({ font: 'anton', weight: 400 });
    expect(pickFont('sans', 700)).toEqual({ font: 'sans', weight: 700 });
    expect(pickFont('oswald', 900)).toEqual({ font: 'oswald', weight: 700 });
  });

  it('FE-STUDIO-FONTPICK-002: finds families by name, id and group, in picker order', () => {
    expect(matchFonts('', groupName)).toEqual(BOOK_FONT_ORDER);
    expect(matchFonts('  GARA ', groupName)).toEqual(['garamond', 'cormorant']);
    expect(matchFonts('mono', groupName)).toEqual(['mono']);
    expect(matchFonts('cat.script', groupName)).toContain('pacifico');
    expect(matchFonts('nothing like it', groupName)).toEqual([]);
  });
});

describe('the picker', () => {
  it('FE-STUDIO-FONTPICK-003: shows the current family set in itself and opens a grouped list with the book families first', () => {
    act(() => useStudioStore.setState({ doc: bookIn('caveat', 'serif') }));
    render(<StudioFontPicker font="serif" weight={400} onPick={vi.fn()} t={t} />);
    const current = screen.getByRole('button', { name: 'journey.studio.fonts.change: Lora' });
    expect(current.getAttribute('aria-expanded')).toBe('false');
    expect(within(current).getByText('Lora').getAttribute('style')).toContain('Lora');

    open();
    expect(current.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'journey.studio.fonts.search' }));
    const groups = screen.getAllByRole('group');
    expect(groups[0]?.getAttribute('aria-label')).toBe('journey.studio.fonts.used');
    const used = within(groups[0] as HTMLElement).getAllByRole('option');
    expect(used.map((o) => o.querySelector('.st-fontpick-face')?.textContent)).toEqual(['Lora', 'Caveat']);
    expect(used[1]?.textContent).toContain('journey.studio.fonts.range 400 700');
    // Every family, once per group it is in, each set in its own face.
    const rows = screen.getAllByRole('option');
    expect(rows).toHaveLength(BOOK_FONT_ORDER.length + 2);
    const anton = rows.find((r) => r.textContent?.startsWith('Anton'));
    expect(anton?.querySelector('span')?.getAttribute('style')).toContain('Anton');
    expect(anton?.textContent).toContain('400');
    expect(rows.filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(2);
  });

  it('FE-STUDIO-FONTPICK-004: picks a family at a weight it has and closes, back on the button', () => {
    const onPick = vi.fn();
    render(<StudioFontPicker font="sans" weight={700} onPick={onPick} t={t} />);
    open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anton' } });
    expect(screen.queryByRole('group', { name: 'journey.studio.fonts.used' })).toBeNull();
    fireEvent.click(screen.getByText('Anton'));
    expect(onPick).toHaveBeenCalledWith({ font: 'anton', weight: 400 });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement?.getAttribute('aria-expanded')).toBe('false');
  });

  it('FE-STUDIO-FONTPICK-005: says when nothing matches, clears the search, and closes on Escape', () => {
    render(<StudioFontPicker font="sans" weight={400} onPick={vi.fn()} t={t} />);
    open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzz' } });
    expect(screen.getByText('journey.studio.fonts.none')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'common.clear' }));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('journey.studio.fonts.none')).toBeNull();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    // A second click on the open button closes it too.
    open();
    open();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('FE-STUDIO-FONTPICK-006: reads a family this build does not know as the default one', () => {
    render(<StudioFontPicker font="gone" weight={400} onPick={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'journey.studio.fonts.change: Poppins' })).toBeTruthy();
  });
});
