import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openingView } from '../../../src/components/Map/openingView';
import MChipStrip from '../../../src/mobile/components/MChipStrip';
import { edgeFadeClass, useEdgeFade } from '../../../src/mobile/components/useEdgeFade';
import { GlassSegment, HeaderActions } from '../../../src/mobile/screens/trip/MTripShellParts';
import { FilePreviewPane, FileTile } from '../../../src/mobile/screens/trip/tabs/MFilesBoard';
import type { TripFile } from '../../../src/types';
import { buildPlanner } from '../../helpers/mobileTrip';
import { render, screen } from '../../helpers/render';
import { setSizeClass } from '../../helpers/sizeClass';

// FE-MOB-LSTRIP-001 onwards: the trip screen's pieces on an iPad or an unfolded foldable,
// after the large-screen review.

const t = (key: string) => key;

/** A box whose sizes the test sets, since jsdom lays nothing out. */
function box(sizes: Partial<Record<'scrollWidth' | 'clientWidth' | 'scrollHeight' | 'clientHeight', number>>) {
  const el = document.createElement('div');
  for (const [key, value] of Object.entries(sizes)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
  return el;
}

describe('useEdgeFade down a list', () => {
  it('FE-MOB-LSTRIP-001: a list that runs on fades at the bottom, then at both ends, then at the top', () => {
    const el = box({ scrollHeight: 1200, clientHeight: 400 });
    const { result } = renderHook(() => useEdgeFade(el, 'y'));
    expect(edgeFadeClass(result.current, 'y')).toBe('m-fade-b');

    act(() => {
      el.scrollTop = 300;
      el.dispatchEvent(new Event('scroll'));
    });
    expect(edgeFadeClass(result.current, 'y')).toBe('m-fade-tb');

    act(() => {
      el.scrollTop = 800;
      el.dispatchEvent(new Event('scroll'));
    });
    expect(edgeFadeClass(result.current, 'y')).toBe('m-fade-t');
    // The sideways classes stay the sideways ones.
    expect(edgeFadeClass({ start: true, end: true })).toBe('m-fade-se');
  });

  it('FE-MOB-LSTRIP-002: new content past the edge is noticed without a scroll or a resize', async () => {
    let height = 400;
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 400 });
    const { result } = renderHook(() => useEdgeFade(el, 'y'));
    expect(result.current).toEqual({ start: false, end: false });

    height = 900;
    await act(async () => {
      el.appendChild(document.createElement('p'));
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(result.current).toEqual({ start: false, end: true });
  });
});

describe('MChipStrip', () => {
  it('FE-MOB-LSTRIP-003: a chip row shrinks to its room and scrolls inside it, named where it is a set of filters', () => {
    render(
      <div className="flex">
        <MChipStrip className="flex-1 gap-[6px]" label="Filters">
          <button type="button">All</button>
        </MChipStrip>
        <button type="button">New note</button>
      </div>
    );
    const strip = screen.getByRole('group', { name: 'Filters' });
    expect(strip).toHaveClass('min-w-0', 'overflow-x-auto', 'flex-1');
  });
});

describe('the top controls of a trip', () => {
  afterEach(() => vi.restoreAllMocks());

  it('FE-MOB-LSTRIP-004: a segmented control keeps to the room between the back and the trailing button', () => {
    const { container } = render(
      <GlassSegment activeKey="b">
        <button type="button" aria-pressed={false}>
          A
        </button>
        <button type="button" aria-pressed>
          B
        </button>
      </GlassSegment>
    );
    const region = container.firstElementChild as HTMLElement;
    expect(region).toHaveClass('start-12', 'end-12', 'pointer-events-none');
    expect(region).not.toHaveClass('inset-x-0');
    const track = container.querySelector('.m-seg') as HTMLElement;
    expect(track).toHaveClass('overflow-x-auto', 'min-w-0');
    expect(track.dataset.tight).toBe('false');
  });

  it('FE-MOB-LSTRIP-005: a control too wide for its room draws its segments tighter and shows the one that is on', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('m-seg') ? 320 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('m-seg') ? 240 : 0;
    });
    const seen = vi.fn();
    HTMLElement.prototype.scrollIntoView = seen;
    const { container } = render(
      <GlassSegment activeKey="notes">
        <button type="button" aria-pressed={false}>
          Chat
        </button>
        <button type="button" aria-pressed>
          Notizen
        </button>
      </GlassSegment>
    );
    expect((container.querySelector('.m-seg') as HTMLElement).dataset.tight).toBe('true');
    expect(seen).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(seen.mock.contexts[0]).toBe(screen.getByText('Notizen'));
  });

  it('FE-MOB-LSTRIP-006: on a wide window a list tab puts its pill in the middle and its buttons at the end, on every tab alike', () => {
    setSizeClass('wide');
    const { container } = render(
      <HeaderActions phone="absolute inset-x-0 mx-auto w-fit" primary={<button type="button">Add</button>}>
        <button type="button">Export</button>
      </HeaderActions>
    );
    const bar = container.firstElementChild as HTMLElement;
    expect(bar).toHaveClass('grid', 'grid-cols-[minmax(48px,1fr)_auto_minmax(max-content,1fr)]');
    expect(screen.getByText('Add').parentElement).toHaveClass('col-start-2');
    expect(screen.getByText('Export').parentElement).toHaveClass('col-start-3', 'justify-self-end');
  });

  it('FE-MOB-LSTRIP-007: on a phone the pill and its buttons stay one group where the tab puts it', () => {
    const { container } = render(
      <HeaderActions phone="absolute start-[52px] end-2 justify-center" primary={<button type="button">Add</button>}>
        <button type="button">Export</button>
      </HeaderActions>
    );
    const bar = container.firstElementChild as HTMLElement;
    expect(bar).toHaveClass('absolute', 'start-[52px]', 'end-2', 'justify-center', 'flex', 'gap-[7px]');
    expect(screen.getByText('Add').parentElement).toBe(bar);
    expect(screen.getByText('Export').parentElement).toBe(bar);
  });
});

describe('the files board', () => {
  const pdf = {
    id: 5,
    trip_id: 1,
    original_name: 'Rail pass.pdf',
    mime_type: 'application/pdf',
    file_size: 2048,
    url: '/uploads/files/pass.pdf',
    created_at: '2026-05-01T10:00:00Z',
  } as unknown as TripFile;

  it('FE-MOB-LSTRIP-010: a tile that opens its file is a plain button; beside the preview it says whether it is the picked one', () => {
    const handlers = { canStar: false, onPick: vi.fn(), onStar: vi.fn(), onMenu: vi.fn(), t };
    const { unmount } = render(<FileTile file={pdf} {...handlers} />);
    expect(screen.getByRole('button', { name: /Rail pass/ })).not.toHaveAttribute('aria-pressed');
    unmount();
    render(<FileTile file={pdf} selected {...handlers} />);
    expect(screen.getByRole('button', { name: /Rail pass/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-LSTRIP-011: a PDF the engine cannot draw in the page gets its type tile beside its name, not a page-high box', () => {
    const planner = buildPlanner();
    const { container } = render(
      <FilePreviewPane
        file={pdf}
        planner={planner}
        onOpen={vi.fn()}
        onStar={vi.fn()}
        onLinks={vi.fn()}
        onMenu={vi.fn()}
      />
    );
    expect(container.querySelector('object')).toBeNull();
    expect(container.querySelector('.aspect-\\[4\\/5\\]')).toBeNull();
    const heading = screen.getByRole('heading', { name: 'Rail pass.pdf' });
    const tile = container.querySelector('.h-\\[92px\\]') as HTMLElement;
    expect(tile.parentElement).toBe(heading.parentElement?.parentElement);
    // The actions keep their labels on one line and wrap as a row instead.
    const open = screen.getByRole('button', { name: /common.open/ });
    expect(open).toHaveClass('whitespace-nowrap');
    expect(open.parentElement).toHaveClass('flex-wrap');
  });
});

describe('openingView', () => {
  const points = [
    { lat: 34.9671, lng: 135.7727 },
    { lat: 35.005, lng: 135.7649 },
  ];
  const options = {
    padding: { top: 20, right: 40, bottom: 20, left: 40 },
    lngFrame: null,
    center: [0, 0] as [number, number],
    zoom: 3,
  };

  it('FE-MOB-LSTRIP-012: beside a pane the map opens a whole level out and refits for its own size; elsewhere as it always has', () => {
    const paned = openingView(points, { ...options, paned: true });
    const plain = openingView(points, options);
    expect(paned.zoom).toBe(Math.floor(plain.zoom));
    expect(paned.refit).not.toBeNull();
    expect(plain.refit).toBeNull();
    expect(plain.framed).toBe(true);
    expect(plain.center).toEqual(paned.center);
  });
});
