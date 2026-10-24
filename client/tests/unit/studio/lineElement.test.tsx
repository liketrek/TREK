import {
  bookLineElementSchema,
  bookLinePoints,
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  type BookDocument,
  type BookElement,
  type BookLineElement,
  type BookSpread,
} from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { LineHandles } from '../../../src/components/Studio/LineHandles';
import { DIVIDER_PRESETS, LINE_PRESETS } from '../../../src/components/Studio/linePresets';
import { constrainPoint } from '../../../src/components/Studio/lineSnap';
import { SpreadView } from '../../../src/components/Studio/SpreadView';
import { EdgeSection } from '../../../src/components/Studio/StudioEdgeControls';
import { StudioInspector } from '../../../src/components/Studio/StudioInspector';
import { StudioLineShelf } from '../../../src/components/Studio/StudioLineShelf';
import { useStudioStore } from '../../../src/store/studioStore';
import { fireEvent, render } from '../../helpers/render';

/**
 * The drawn line and the cut edge in the Studio: drawn on the page, placed
 * from the shelf, styled in the inspector and shaped by its handles.
 */

const page = bookPageSetupSchema.parse({});
const t = (k: string) => k;

const line = (over: Partial<BookLineElement> = {}) =>
  bookLineElementSchema.parse({ id: 'l1', kind: 'line', frame: { x: 230, y: 100, w: 100, h: 4 }, ...over });

function spread(elements: BookElement[]): BookSpread {
  return { id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null };
}

function load(elements: BookElement[], selection = elements.slice(0, 1).map((e) => e.id)) {
  useStudioStore.getState().load({ version: 1, title: 'T', page, spreads: [spread(elements)] } as BookDocument);
  useStudioStore.getState().select(selection);
}

const els = () => useStudioStore.getState().doc?.spreads[0].elements ?? [];
const first = () => els()[0] as BookLineElement;

beforeEach(() => load([]));

describe('on the page', () => {
  it('FE-STUDIO-LINEEL-001: draws a line as a stroked body with its heads filled', () => {
    const { container } = render(
      <SpreadView spread={spread([line({ endCap: 'arrow', dash: 'dashed' })])} page={page} />
    );
    const paths = [...container.querySelectorAll('svg path')];
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute('stroke')).toBe('#141414');
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('1.5 1');
    expect(paths[1].getAttribute('fill')).toBe('#141414');
  });

  it('FE-STUDIO-LINEEL-002: cuts a rectangle with an edge as a path, and clips a photo to its edge', () => {
    const frame = { x: 10, y: 10, w: 60, h: 40 };
    const rect = bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame, edge: 'zigzag', edgeSize: 3 });
    const plain = bookShapeElementSchema.parse({ id: 's2', kind: 'shape', frame });
    const photo = bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame, photoId: 4, edge: 'perforated' });
    const { container } = render(<SpreadView spread={spread([rect, plain, photo])} page={page} />);
    const cut = container.querySelectorAll('svg path')[0];
    expect(cut.getAttribute('d')?.split('L').length).toBeGreaterThan(40);
    // The clip's id is the photo's with a suffix of its own, so a spread drawn twice keeps them apart.
    expect(container.querySelector('clipPath[id^="c-p1-"] path')?.getAttribute('d')).toMatch(/^M0 0L/);
  });
});

describe('the shelf', () => {
  it('FE-STUDIO-LINEEL-003: offers every line and divider, each labelled, and places it on the right-hand page', () => {
    const added: BookElement[] = [];
    const { getByLabelText, container } = render(
      <StudioLineShelf page={page} single={false} onAdd={(el) => added.push(el)} t={t} />
    );
    expect(container.querySelectorAll('.st-shape-btn')).toHaveLength(LINE_PRESETS.length + DIVIDER_PRESETS.length);
    fireEvent.click(getByLabelText('journey.studio.linePreset.route'));
    fireEvent.click(getByLabelText('journey.studio.linePreset.divider-sun'));
    const [route, divider] = added as BookLineElement[];
    expect(route).toMatchObject({ kind: 'line', dash: 'dotted', curve: 'smooth', startCap: 'dot', endCap: 'arrow' });
    expect(route.points).toHaveLength(3);
    expect(bookLinePoints(route)[0][0]).toBeCloseTo(262.5, 1);
    expect(divider).toMatchObject({ ornament: 'sun', strokeWidth: 0.3 });
  });

  it('FE-STUDIO-LINEEL-004: places a line on a single page from its own left edge', () => {
    const added: BookElement[] = [];
    const { getByLabelText } = render(<StudioLineShelf page={page} single onAdd={(el) => added.push(el)} t={t} />);
    fireEvent.click(getByLabelText('journey.studio.linePreset.straight'));
    expect(bookLinePoints(added[0] as BookLineElement)[0][0]).toBeCloseTo(52.5, 1);
  });
});

describe('the inspector', () => {
  const draw = () =>
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

  it('FE-STUDIO-LINEEL-005: styles a line, its ends and its ornament, refitting the frame for a head', () => {
    load([line()]);
    const { getByText, getByTitle } = draw();
    fireEvent.click(getByText('journey.studio.strokeDashed'));
    expect(first().dash).toBe('dashed');
    fireEvent.click(getByText('journey.studio.lineCourse.smooth'));
    fireEvent.click(getByText('journey.studio.lineBody.wave'));
    expect(first()).toMatchObject({ curve: 'smooth', squiggle: 'wave' });
    const before = first().frame.h;
    fireEvent.click(document.querySelectorAll('[title="journey.studio.cap.arrow"]')[1] as HTMLElement);
    expect(first().endCap).toBe('arrow');
    expect(first().frame.h).toBeGreaterThan(before);
    fireEvent.click(getByText('journey.studio.swapEnds'));
    expect(first()).toMatchObject({ startCap: 'arrow', endCap: 'none' });
    // The ornaments stay folded away until a line has one.
    const ornaments = [...document.querySelectorAll('.st-section-head')].find(
      (b) => b.textContent === 'journey.studio.ornamentTitle'
    ) as HTMLElement;
    fireEvent.click(ornaments);
    fireEvent.click(getByTitle('journey.studio.ornament.heart'));
    expect(first().ornament).toBe('heart');
  });

  it('FE-STUDIO-LINEEL-006: cuts an edge on a shape from its tiles and sets how deep it bites', () => {
    const frame = { x: 10, y: 10, w: 60, h: 40 };
    load([bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame })]);
    const { getByLabelText, container } = draw();
    const head = [...container.querySelectorAll('.st-section-head')].find(
      (b) => b.textContent === 'journey.studio.edgeStyle'
    ) as HTMLElement;
    fireEvent.click(head);
    fireEvent.click(getByLabelText('journey.studio.edge.perforated'));
    expect(els()[0]).toMatchObject({ edge: 'perforated' });
  });
});

describe('the edge controls', () => {
  it('FE-STUDIO-LINEEL-007: stay away from a shape that takes no edge, and say so where one is set anyway', () => {
    const set: unknown[] = [];
    const none = render(
      <EdgeSection edge={undefined} edgeSize={undefined} outline="heart" onSet={(p) => set.push(p)} t={t} />
    );
    expect(none.container.innerHTML).toBe('');
    const stray = render(<EdgeSection edge="torn" edgeSize={2} outline="heart" onSet={(p) => set.push(p)} t={t} />);
    expect(stray.getByText('journey.studio.edgeUnavailable')).toBeTruthy();
    fireEvent.click(stray.getByLabelText('journey.studio.edge.straight'));
    expect(set).toEqual([{ edge: 'straight' }]);
    const photo = render(<EdgeSection edge="scallop" edgeSize={4} outline={null} onSet={(p) => set.push(p)} t={t} />);
    const depth = photo.container.querySelector('.st-num input') as HTMLInputElement;
    expect(depth.value).toBe('4');
  });
});

describe('the handles', () => {
  it('FE-STUDIO-LINEEL-008: holds a dragged end level or plumb near it, and to steps with shift', () => {
    const level = constrainPoint([100, 1], [0, 0], false);
    expect(level[1]).toBe(0);
    expect(level[0]).toBeCloseTo(100, 1);
    expect(constrainPoint([100, 30], [0, 0], false)).toEqual([100, 30]);
    const stepped = constrainPoint([100, 30], [0, 0], true);
    expect((Math.atan2(stepped[1], stepped[0]) * 180) / Math.PI).toBeCloseTo(15, 5);
    expect(constrainPoint([5, 5], undefined, true)).toEqual([5, 5]);
  });

  it('FE-STUDIO-LINEEL-009: drags an end on the spread, adds a point from the middle and removes it again', () => {
    load([line()]);
    const draw = () => render(<LineHandles el={first()} spreadIndex={0} scaled={2} t={t} />);
    const { container, unmount } = draw();
    const ends = container.querySelectorAll('[title="journey.studio.addPoint"]');
    expect(ends).toHaveLength(1);
    const handles = container.querySelectorAll('.st-handle');
    const end = handles[handles.length - 1] as HTMLElement;
    fireEvent.pointerDown(end, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(end, { clientX: 20, clientY: 40, pointerId: 1 });
    fireEvent.pointerUp(end, { pointerId: 1 });
    const moved = bookLinePoints(first());
    expect(moved[1][0]).toBeCloseTo(340, 1);
    expect(moved[1][1]).toBeCloseTo(122, 1);
    unmount();

    const again = draw();
    const mid = again.container.querySelector('[title="journey.studio.addPoint"]') as HTMLElement;
    fireEvent.pointerDown(mid, { clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerUp(mid, { pointerId: 2 });
    expect(first().points).toHaveLength(3);
    again.unmount();

    const third = draw();
    fireEvent.doubleClick(third.container.querySelector('[title="journey.studio.removePoint"]') as HTMLElement);
    expect(first().points).toHaveLength(2);
  });
});
