import type { BookDocument } from '@trek/shared';
import { BOOK_GRIDS, MAX_SPREAD_ELEMENTS, bookPageSetupSchema, normalizeBookDocument } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { StudioElementsPanel } from './StudioElementsPanel';
import { searchIcons } from './iconLibrary';
import { DIVIDER_PRESETS, LINE_PRESETS } from './linePresets';
import { matchStickers } from './stickerLibrary';

/**
 * FE-STUDIO-ELEMENTS-001 to FE-STUDIO-ELEMENTS-007: the Elements panel's six
 * tabs, each opening its own shelves, and each placing what it shows on the
 * open page, as long as the page has room for it.
 */

const t = (k: string) => k;
const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const source = { entries: [], photos: [] };

const book = (): BookDocument =>
  normalizeBookDocument({
    version: 1,
    title: 'Porto',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads: [{ id: 'sp1', role: 'inner', entryId: null, background: null, elements: [], parked: [] }],
  });

const elements = () => useStudioStore.getState().doc?.spreads[0]?.elements ?? [];
const last = () => elements()[elements().length - 1];
const open = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));

beforeEach(() => {
  window.localStorage.clear();
  useStudioStore.getState().load(book());
});

describe('the Elements panel', () => {
  it('FE-STUDIO-ELEMENTS-001: opens on Text, with the quotation mark among the plain styles', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(screen.getByRole('tab', { name: 'journey.studio.text' }).id);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.quoteMark' }));
    expect(last()).toMatchObject({ kind: 'text', text: '“', size: 46 });
  });

  it('FE-STUDIO-ELEMENTS-002: puts the outline-only rectangle first among the basic shapes', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.shapes');
    const outline = screen.getByRole('button', { name: 'journey.studio.shapeKind.outline' });
    expect(outline.closest('.st-shape-grid')?.firstElementChild).toBe(outline);
    fireEvent.click(outline);
    expect(last()).toMatchObject({ kind: 'shape', shape: 'rect', fill: null, stroke: '#141414' });
  });

  it('FE-STUDIO-ELEMENTS-003: keeps the plain rule with the drawn lines and the dividers', () => {
    const { container } = render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.lines');
    expect(container.querySelectorAll('.st-shape-btn')).toHaveLength(LINE_PRESETS.length + DIVIDER_PRESETS.length + 1);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.shapeKind.line' }));
    expect(last()).toMatchObject({ kind: 'shape', shape: 'rect', frame: { h: 0.5 } });
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.linePreset.route' }));
    expect(last()).toMatchObject({ kind: 'line' });
  });

  it('FE-STUDIO-ELEMENTS-004: offers frames in their styles and shapes, and the grids, in one tab', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.frames');
    expect(screen.getByText('journey.studio.frameStyles')).toBeTruthy();
    expect(screen.getByText('journey.studio.frameShapes')).toBeTruthy();
    expect(screen.getByText('journey.studio.grids')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.polaroidFrame' }));
    expect(last()).toMatchObject({ kind: 'photo', photoId: null, frameStyle: 'polaroid' });
    const grid = BOOK_GRIDS[0];
    if (!grid) throw new Error('no grids');
    fireEvent.click(screen.getByRole('button', { name: grid.id }));
    expect(useStudioStore.getState().selection).toHaveLength(grid.cells.length);
  });

  it('FE-STUDIO-ELEMENTS-007: places nothing on a page that holds all it can, a frame or a whole grid', () => {
    const grid = BOOK_GRIDS.find((g) => g.cells.length > 1);
    if (!grid) throw new Error('no grid of several frames');
    const crowded = (n: number) =>
      normalizeBookDocument({
        ...book(),
        spreads: [
          {
            id: 'sp1',
            role: 'inner',
            entryId: null,
            background: null,
            parked: [],
            elements: Array.from({ length: n }, (_, i) => ({
              id: `s${i}`,
              kind: 'shape',
              frame: { x: 0, y: 0, w: 5, h: 5 },
            })),
          },
        ],
      });
    useStudioStore.getState().load(crowded(MAX_SPREAD_ELEMENTS));
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.frames');
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.polaroidFrame' }));
    expect(elements()).toHaveLength(MAX_SPREAD_ELEMENTS);
    expect(useStudioStore.getState().selection).toEqual([]);

    useStudioStore.getState().load(crowded(MAX_SPREAD_ELEMENTS - 1));
    fireEvent.click(screen.getByRole('button', { name: grid.id }));
    expect(elements()).toHaveLength(MAX_SPREAD_ELEMENTS - 1);
    expect(useStudioStore.getState().canUndo()).toBe(false);
  });

  it('FE-STUDIO-ELEMENTS-005: searches the icons and the stickers above their grids', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.icons');
    fireEvent.change(screen.getByRole('textbox', { name: 'journey.studio.searchIcons' }), {
      target: { value: 'compass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Compass' }));
    expect(last()).toMatchObject({ kind: 'icon', name: 'Compass' });
    open('journey.studio.stickers');
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.sticker.sun' }));
    expect(last()).toMatchObject({ kind: 'sticker', stickerId: 'sun' });
  });

  it('FE-STUDIO-ELEMENTS-006: says in the search field how many stickers and icons the words match', () => {
    render(<StudioElementsPanel page={page} t={t} source={source} />);
    open('journey.studio.stickers');
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'journey.studio.searchStickers' }), {
      target: { value: 'sun' },
    });
    expect(screen.getByRole('status').textContent).toBe(String(matchStickers('sun', null, t).length));
    open('journey.studio.icons');
    fireEvent.change(screen.getByRole('textbox', { name: 'journey.studio.searchIcons' }), {
      target: { value: 'compass' },
    });
    expect(screen.getByRole('status').textContent).toBe(String(searchIcons('compass').length));
    // Spaces are not a search, so they leave the count out.
    fireEvent.change(screen.getByRole('textbox', { name: 'journey.studio.searchIcons' }), {
      target: { value: '  ' },
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
