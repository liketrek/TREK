import type { BookDocument, BookElement, JourneyStats } from '@trek/shared';
import {
  bookIconElementSchema,
  bookLineElementSchema,
  bookMapElementSchema,
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
} from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { useStudioStore } from '../../../store/studioStore';
import { StudioInspector } from '../StudioInspector';

/**
 * FE-STUDIO-INSPORDER-001 to FE-STUDIO-INSPORDER-011: the inspector's groups
 * per kind, in the one order every kind follows (what it is and says, where it
 * sits, how it looks, the effects, arrange); the folded groups opening on an
 * element that uses them and on nothing else; and every group mounted afresh
 * for the next selection.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const FRAME = { x: 20, y: 30, w: 60, h: 40 };

/** The value, or a failed test saying it was missing. */
function must<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

const text = (over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id: 't1', kind: 'text', frame: FRAME, text: 'Harbour', ...over }) as BookElement;
const photo = (over: Record<string, unknown> = {}) =>
  bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame: FRAME, photoId: 12, ...over }) as BookElement;
const shape = (over: Record<string, unknown> = {}) =>
  bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame: FRAME, ...over }) as BookElement;
const icon = () => bookIconElementSchema.parse({ id: 'i1', kind: 'icon', frame: FRAME, name: 'Plane' }) as BookElement;
const sticker = () =>
  bookStickerElementSchema.parse({ id: 'k1', kind: 'sticker', frame: FRAME, stickerId: 'lemon' }) as BookElement;
const line = () => bookLineElementSchema.parse({ id: 'l1', kind: 'line', frame: FRAME }) as BookElement;
const map = () =>
  bookMapElementSchema.parse({
    id: 'm1',
    kind: 'map',
    frame: FRAME,
    countries: ['IS'],
    points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavik' }],
  }) as BookElement;
const stats = () => bookStatsElementSchema.parse({ id: 'st1', kind: 'stats', frame: FRAME }) as BookElement;

function load(elements: BookElement[], selection = elements.slice(0, 1).map((e) => e.id)) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null }],
  } as BookDocument);
  useStudioStore.getState().select(selection);
}

function draw(live: JourneyStats | null = null) {
  return render(
    <StudioInspector
      spreadIndex={0}
      page={page}
      stats={live}
      path={[]}
      source={{ entries: [], photos: [], photoEntries: {} }}
      setPageNumbers={() => {}}
      t={(k: string) => k}
      locale="en"
      onOpenPanel={vi.fn()}
    />
  );
}

/** The groups the panel shows, top to bottom, by their headings. */
const groups = (c: HTMLElement) =>
  [...c.querySelectorAll('.st-section.is-fold > h3 .st-section-label')].map((l) => l.textContent);

/** A group's head, the button that folds it. */
const headOf = (label: string) =>
  must(
    [...document.querySelectorAll('.st-section-head')].find(
      (h) => h.querySelector('.st-section-label')?.textContent === label
    )
  );

/** Whether a group is open, read off its head. */
function isOpen(label: string): boolean {
  return headOf(label).getAttribute('aria-expanded') === 'true';
}

/** Opens a folded group. */
function open(label: string) {
  if (!isOpen(label)) fireEvent.click(headOf(label));
}

beforeEach(() => {
  useStudioStore.getState().load({ version: 1, title: 'T', page, spreads: [] } as unknown as BookDocument);
});

describe('the order of the groups', () => {
  it('FE-STUDIO-INSPORDER-001: puts a text and a photo in the order every kind follows', () => {
    load([text()]);
    const t = draw();
    expect(groups(t.container)).toEqual([
      'journey.studio.text',
      'journey.studio.position',
      'journey.studio.typography',
      'journey.studio.colour',
      'journey.studio.fx.placement',
      'journey.studio.fx.effects',
      'journey.studio.arrange',
    ]);
    t.unmount();

    load([photo()]);
    expect(groups(draw().container)).toEqual([
      'journey.studio.crop',
      'journey.studio.position',
      'journey.studio.look',
      'journey.studio.mask',
      'journey.studio.edgeStyle',
      'journey.studio.photo.edges',
      'journey.studio.photo.adjust',
      'journey.studio.photo.duotone',
      'journey.studio.arrange',
    ]);
  });

  it('FE-STUDIO-INSPORDER-002: puts a shape, an icon, a sticker and a line in the same order', () => {
    const cases: [BookElement, string[]][] = [
      [
        shape(),
        [
          'journey.studio.shape',
          'journey.studio.position',
          'journey.studio.fill',
          'journey.studio.stroke',
          'journey.studio.edgeStyle',
          'journey.studio.arrange',
        ],
      ],
      [icon(), ['journey.studio.icon', 'journey.studio.position', 'journey.studio.look', 'journey.studio.arrange']],
      [sticker(), ['journey.studio.stickerColours', 'journey.studio.position', 'journey.studio.arrange']],
      [
        line(),
        [
          'journey.studio.kind.line',
          'journey.studio.position',
          'journey.studio.look',
          'journey.studio.lineEnds',
          'journey.studio.ornamentTitle',
          'journey.studio.arrange',
        ],
      ],
    ];
    for (const [el, expected] of cases) {
      load([el]);
      const view = draw();
      expect(groups(view.container)).toEqual(expected);
      view.unmount();
    }
  });

  it('FE-STUDIO-INSPORDER-003: puts what a map and a summary say before their place, and their look after it', () => {
    load([map()]);
    const m = draw();
    expect(groups(m.container)).toEqual([
      'journey.studio.routeMap',
      'journey.studio.mapFraming',
      'journey.studio.position',
      'journey.studio.routeLook',
      'journey.studio.mapLayers',
      'journey.studio.typography',
      'journey.studio.colour',
      'journey.studio.arrange',
    ]);
    m.unmount();

    load([stats()]);
    expect(groups(draw().container)).toEqual([
      'journey.studio.metrics',
      'journey.studio.layout',
      'journey.studio.position',
      'journey.studio.typography',
      'journey.studio.colour',
      'journey.studio.arrange',
    ]);
  });

  it('FE-STUDIO-INSPORDER-004: gives several elements their angle without the frame, and arrange open', () => {
    load([shape(), shape({ id: 's2', frame: { x: 100, y: 30, w: 20, h: 20 } })], ['s1', 's2']);
    const { container } = draw();
    expect(groups(container)).toContain('journey.studio.position');
    expect(isOpen('journey.studio.position')).toBe(false);
    open('journey.studio.position');
    // One x for two elements would stack them, so the frame's numbers stay with a single selection.
    expect(screen.queryAllByRole('spinbutton', { name: (n) => n.startsWith('X') })).toHaveLength(0);
    expect(screen.getAllByRole('spinbutton', { name: (n) => n.startsWith('journey.studio.rotation') })).toHaveLength(1);
    expect(isOpen('journey.studio.arrange')).toBe(true);
    expect(screen.getByLabelText('journey.studio.showLayers')).toBeTruthy();
  });
});

describe('the folded groups', () => {
  it('FE-STUDIO-INSPORDER-005: stay folded on a plain element and open on one that uses them', () => {
    load([shape()]);
    const plain = draw();
    expect(['journey.studio.position', 'journey.studio.stroke', 'journey.studio.edgeStyle'].map(isOpen)).toEqual([
      false,
      false,
      false,
    ]);
    plain.unmount();

    load([shape({ rotation: 12, stroke: '#141414', strokeWidth: 0.5, edge: 'zigzag' })]);
    const used = draw();
    expect(['journey.studio.position', 'journey.studio.stroke', 'journey.studio.edgeStyle'].map(isOpen)).toEqual([
      true,
      true,
      true,
    ]);
    used.unmount();

    load([text({ transform: 'upper' })]);
    const cased = draw();
    expect(isOpen('journey.studio.fx.placement')).toBe(true);
    expect(isOpen('journey.studio.fx.effects')).toBe(false);
    cased.unmount();

    load([photo({ mask: 'heart', duotone: { dark: '#1a1a1a', light: '#f5e6c8' } })]);
    draw();
    expect(isOpen('journey.studio.mask')).toBe(true);
    expect(isOpen('journey.studio.photo.duotone')).toBe(true);
    expect(isOpen('journey.studio.photo.adjust')).toBe(false);
  });

  it('FE-STUDIO-INSPORDER-006: open the position of a sticker, which is turned as a matter of course', () => {
    load([sticker()]);
    draw();
    expect(isOpen('journey.studio.position')).toBe(true);
    expect(screen.getByRole('button', { name: 'journey.studio.stickerTurnRight' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'journey.studio.stickerFlip' })).toBeTruthy();
    // One angle field and one opacity field, not a second pair in a group of the sticker's own.
    expect(screen.getAllByRole('spinbutton', { name: (n) => n.startsWith('journey.studio.rotation') })).toHaveLength(1);
  });

  it('FE-STUDIO-INSPORDER-007: mount afresh for the next selection, remembering nothing', () => {
    load([shape(), shape({ id: 's2' })]);
    draw();
    open('journey.studio.position');
    expect(isOpen('journey.studio.position')).toBe(true);
    act(() => useStudioStore.getState().select(['s2']));
    expect(isOpen('journey.studio.position')).toBe(false);
  });
});

describe('several stickers at once', () => {
  it('FE-STUDIO-INSPORDER-009: mirror and turn every sticker selected, as the placement group did', () => {
    const second = bookStickerElementSchema.parse({
      id: 'k2',
      kind: 'sticker',
      frame: { x: 100, y: 30, w: 40, h: 40 },
      stickerId: 'lemon',
    }) as BookElement;
    load([sticker(), second], ['k1', 'k2']);
    draw();
    expect(isOpen('journey.studio.position')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerFlip' }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.stickerTurnRight' }));
    const placed = must(useStudioStore.getState().doc).spreads[0]?.elements ?? [];
    expect(placed.map((e) => (e.kind === 'sticker' ? e.flipX : null))).toEqual([true, true]);
    expect(placed.map((e) => e.rotation)).toEqual([15, 15]);
  });

  it('FE-STUDIO-INSPORDER-010: offer no mirror when the selection is not all stickers', () => {
    load([sticker(), shape()], ['k1', 's1']);
    draw();
    expect(groups(document.body)).toContain('journey.studio.position');
    expect(screen.queryByRole('button', { name: 'journey.studio.stickerFlip' })).toBeNull();
    expect(screen.getByRole('button', { name: 'journey.studio.stickerTurnRight' })).toBeTruthy();
  });
});

describe('the arrange rows', () => {
  it('FE-STUDIO-INSPORDER-011: put each row under its label, in sets that move to a second line whole', () => {
    load([shape(), shape({ id: 's2', frame: { x: 100, y: 30, w: 20, h: 20 } })], ['s1', 's2']);
    const { container } = draw();
    const rows = [...container.querySelectorAll('.st-arrange > .st-line')];
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.classList.contains('is-wide'))).toBe(true);
    const sets = [...container.querySelectorAll('.st-arrange-row > .st-arrange-set')];
    // The six edges and the two spacings; the four steps of the stack, then grouping and the way to Layers.
    expect(sets.map((set) => set.querySelectorAll('button').length)).toEqual([6, 2, 4, 2]);
  });
});

describe('the labelled lines', () => {
  it('FE-STUDIO-INSPORDER-008: set every label apart from its control, so a long one wraps instead of being cut', () => {
    load([text({ binding: { source: 'entry.location', entryId: 7, format: 'dms' } })]);
    const { container } = draw();
    const lines = [...container.querySelectorAll('.st-line')];
    expect(lines.length).toBeGreaterThan(0);
    for (const row of lines) {
      expect(row.querySelector(':scope > .st-line-label')).not.toBeNull();
      expect(row.querySelector(':scope > .st-line-body')).not.toBeNull();
    }
    for (const field of container.querySelectorAll('.st-num')) {
      expect(field.querySelector(':scope > .st-num-label')).not.toBeNull();
      expect(field.querySelector(':scope > .st-num-box')).not.toBeNull();
    }
  });
});
