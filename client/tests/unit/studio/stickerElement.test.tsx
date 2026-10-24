import type { BookDocument, BookElement, BookSpread } from '@trek/shared';
import { bookPageSetupSchema, bookSpreadSchema, bookStickerElementSchema } from '@trek/shared';
import { bookSticker } from '@trek/shared/stickers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SpreadView } from '../../../src/components/Studio/SpreadView';
import { StudioCanvas } from '../../../src/components/Studio/StudioCanvas';
import { StudioInspector } from '../../../src/components/Studio/StudioInspector';
import { StudioStickersPanel } from '../../../src/components/Studio/StudioStickersPanel';
import { STICKER_DRAG_TYPE, turned, withSlotColor } from '../../../src/components/Studio/stickerLibrary';
import { useStudioStore } from '../../../src/store/studioStore';
import { fireEvent, render, screen } from '../../helpers/render';

/**
 * The sticker element in the Studio: drawn on the page as an inline SVG of its
 * layers in the colours it carries, mirrored when flipped, nothing at all for
 * an id this build does not know; placed from its panel by a click or a drag;
 * recoloured slot by slot, flipped and turned in the inspector.
 */

/** The value, or a failed test where there is none. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const FRAME = { x: 20, y: 30, w: 60, h: 48 };
const t = (k: string, params?: Record<string, string | number>) => (params ? `${k} ${JSON.stringify(params)}` : k);

const sticker = (over: Record<string, unknown> = {}): BookElement =>
  bookStickerElementSchema.parse({
    id: 'k1',
    kind: 'sticker',
    frame: FRAME,
    stickerId: 'lemon',
    ...over,
  }) as BookElement;

function draw(elements: BookElement[]) {
  const spread: BookSpread = { id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null };
  return render(<SpreadView spread={spread} page={page} />);
}

function load(elements: BookElement[]) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null }],
  } as BookDocument);
  useStudioStore.getState().select(elements.slice(0, 1).map((e) => e.id));
}

const stored = () => must(must(useStudioStore.getState().doc).spreads[0]).elements;

beforeEach(() => {
  window.localStorage.clear();
});

describe('a sticker on the page', () => {
  it('draws every layer of the drawing in its frame, kept in proportion', () => {
    const { container } = draw([sticker()]);
    const svg = must(container.querySelector('svg'));
    const lemon = must(bookSticker('lemon'));
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${lemon.box[0]} ${lemon.box[1]}`);
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svg.querySelectorAll('path')).toHaveLength(lemon.layers.length);
    const frame = svg.parentElement as HTMLElement;
    expect([frame.style.left, frame.style.width]).toEqual(['20mm', '60mm']);
  });

  it('paints the slots in the colours the element carries, its own elsewhere, and mirrors it when flipped', () => {
    const lemon = must(bookSticker('lemon'));
    const { container } = draw([sticker({ colors: ['#123456'], flipX: true })]);
    const fills = [...container.querySelectorAll('path')].map((p) => p.getAttribute('fill'));
    expect(fills).toContain('#123456');
    expect(fills).not.toContain(must(lemon.slots[0]).color);
    expect(fills).toContain(must(lemon.slots[1]).color);
    expect(must(container.querySelector('svg')).style.transform).toBe('scaleX(-1)');
  });

  it('strokes the line layers of a doodle with round ends', () => {
    const { container } = draw([sticker({ stickerId: 'curlyArrow' })]);
    const path = must(container.querySelector('path'));
    expect([path.getAttribute('fill'), path.getAttribute('stroke-linecap')]).toEqual(['none', 'round']);
  });

  it('draws nothing for a sticker this library does not hold', () => {
    const { container } = draw([sticker({ stickerId: 'unicornCastle' })]);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('the stickers panel', () => {
  beforeEach(() => load([]));

  it('lists the library by theme and places a sticker in the middle of the right-hand page on a click', () => {
    render(<StudioStickersPanel page={page} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.sticker.eiffelTower' }));
    const placed = must(stored()[0]);
    expect(placed).toMatchObject({ kind: 'sticker', stickerId: 'eiffelTower' });
    expect(placed.frame.x + placed.frame.w / 2).toBeCloseTo(315, 1);
    expect(useStudioStore.getState().selection).toEqual([placed.id]);
    // It is on the recent shelf now, above the themes.
    expect(screen.getByText('journey.studio.stickersRecent')).toBeTruthy();
  });

  it('finds stickers by what is typed, and says when nothing matches', () => {
    render(<StudioStickersPanel page={page} t={t} />);
    // No theme chips: the library is browsed by its theme sections and searched by name.
    expect(screen.queryByRole('radiogroup')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'journey.studio.searchStickers' }), {
      target: { value: 'zzzz' },
    });
    expect(screen.getByText('journey.studio.noMatches')).toBeTruthy();
  });

  it('hands the sticker id to a drag', () => {
    render(<StudioStickersPanel page={page} t={t} />);
    const setData = vi.fn();
    fireEvent.dragStart(screen.getByRole('button', { name: 'journey.studio.sticker.sun' }), {
      dataTransfer: { setData, effectAllowed: '' },
    });
    expect(setData).toHaveBeenCalledWith(STICKER_DRAG_TYPE, 'sun');
  });
});

describe('a sticker dropped on the sheet', () => {
  it('lands centred where it is let go', () => {
    const spread = bookSpreadSchema.parse({ id: 'sp-1', elements: [] });
    const addElement = vi.fn();
    const original = useStudioStore.getState().addElement;
    useStudioStore.setState({ selection: [], addElement });
    render(
      <StudioCanvas
        spread={spread}
        spreadIndex={0}
        page={page}
        zoom={1}
        pxPerMm={2}
        bookView={false}
        dropLabel="drop"
        fileDropLabel="files"
      />
    );
    const stage = document.querySelector('.st-stage') as HTMLElement;
    const transfer = {
      types: [STICKER_DRAG_TYPE],
      files: [],
      getData: (type: string) => (type === STICKER_DRAG_TYPE ? 'sun' : ''),
      dropEffect: '',
    };
    fireEvent.dragOver(stage, { dataTransfer: transfer, clientX: 100, clientY: 100 });
    fireEvent.drop(stage, { dataTransfer: transfer, clientX: 100, clientY: 100 });
    expect(addElement).toHaveBeenCalledTimes(1);
    const [index, el] = must(addElement.mock.calls[0]);
    expect(index).toBe(0);
    expect(el).toMatchObject({ kind: 'sticker', stickerId: 'sun', frame: { w: 63, h: 63 } });
    useStudioStore.setState({ addElement: original });
  });
});

describe('the sticker inspector', () => {
  const inspector = () =>
    render(
      <StudioInspector
        spreadIndex={0}
        page={page}
        stats={null}
        path={[]}
        source={{ entries: [], photos: [], photoEntries: {} }}
        setPageNumbers={() => {}}
        t={t}
        locale="en"
      />
    );

  it('recolours one slot, keeping the ones before it as they show, and puts the colours back', () => {
    load([sticker()]);
    const { container } = inspector();
    const lines = container.querySelectorAll('.st-line');
    expect(lines).toHaveLength(2);
    const second = must(lines[1]).querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(second, { target: { value: '#00ff00' } });
    const lemon = must(bookSticker('lemon'));
    expect(stored()[0]).toMatchObject({ colors: [must(lemon.slots[0]).color, '#00ff00'] });
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerResetColours' }));
    expect(stored()[0]).toMatchObject({ colors: [] });
  });

  it('mirrors and turns the sticker a step at a time', () => {
    load([sticker({ rotation: 170 })]);
    inspector();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerFlip' }));
    expect(stored()[0]).toMatchObject({ flipX: true });
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerTurnRight' }));
    expect(must(stored()[0]).rotation).toBe(-175);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerTurnLeft' }));
    expect(must(stored()[0]).rotation).toBe(170);
  });

  it('says so for a sticker the library does not hold, with nothing to recolour', () => {
    load([sticker({ stickerId: 'unicornCastle' })]);
    const { container } = inspector();
    expect(screen.getByText('journey.studio.stickerMissing')).toBeTruthy();
    expect(container.querySelectorAll('.st-line')).toHaveLength(0);
  });
});

describe('the inspector helpers', () => {
  it('turns within a half turn either way', () => {
    expect(turned(170, 15)).toBe(-175);
    expect(turned(-170, -15)).toBe(175);
    expect(turned(0, 15)).toBe(15);
  });

  it('writes the slot colours in order, filling the slots before the one picked', () => {
    const slots = [
      { name: 'a', color: '#111111' },
      { name: 'b', color: '#222222' },
      { name: 'c', color: '#333333' },
    ];
    const el = bookStickerElementSchema.parse({ id: 'k', kind: 'sticker', frame: FRAME, stickerId: 'x' });
    expect(withSlotColor(el, slots, 2, '#999999')).toEqual(['#111111', '#222222', '#999999']);
    expect(withSlotColor({ ...el, colors: ['#aaaaaa', '#bbbbbb', '#cccccc'] }, slots, 0, '#999999')).toEqual([
      '#999999',
      '#bbbbbb',
      '#cccccc',
    ]);
  });
});
