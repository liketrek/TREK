import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import type { TourGpxImport } from '../useTourGpxImport';
import { TourAddMenu } from './TourAddMenu';

const library = vi.hoisted(() => ({ show: vi.fn(), options: null as unknown }));
vi.mock('../library/useTourLibrary', () => ({
  useTourLibrary: (options: unknown) => {
    library.options = options;
    return { show: library.show };
  },
}));
vi.mock('../library/TourLibraryDialog', () => ({ TourLibraryDialog: () => <div data-testid="library-dialog" /> }));
const walk = vi.hoisted(() => ({ show: vi.fn(), options: null as unknown }));
vi.mock('../walk/useWalkImport', () => ({
  useWalkImport: (options: unknown) => {
    walk.options = options;
    return { show: walk.show };
  },
}));
vi.mock('../walk/WalkImportDialog', () => ({
  WalkImportDialog: ({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) => (
    <div data-testid="walk-dialog" data-unsaved={String(hasUnsavedChanges)} />
  ),
}));

// FE-TOUR-ADD-001 to FE-TOUR-ADD-006

function planner(mode: 'neutral' | 'new-draft' = 'new-draft', overrides: Record<string, unknown> = {}) {
  return {
    tripId: 5,
    mode: { type: mode },
    hasUnsavedChanges: false,
    openTour: vi.fn(),
    startNewTour: vi.fn(),
    startDerivedTour: vi.fn(),
    ...overrides,
  } as unknown as Parameters<typeof TourAddMenu>[0]['planner'];
}

const gpxImport = (importing = false) => ({ pick: vi.fn(), importing }) as unknown as TourGpxImport;
const entries = () => screen.getAllByRole('button').filter((button) => button.closest('[role="group"]'));
const open = () => fireEvent.click(screen.getByTestId('tour-rail-add'));

afterEach(() => vi.clearAllMocks());

describe('TourAddMenu (LIB-02)', () => {
  it('FE-TOUR-ADD-001: one button opens the four ways to add a tour, in order', () => {
    render(<TourAddMenu planner={planner()} gpxImport={gpxImport()} onTakenOver={vi.fn()} disabled={false} />);
    const button = screen.getByTestId('tour-rail-add');
    expect(button).toHaveAccessibleName('Add tour');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    open();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(entries().map((entry) => entry.textContent)).toEqual([
      'Plan new tour',
      'Import GPX or KML',
      'Import walk from Google Maps',
      'Take over a tour from another trip',
    ]);
  });

  it('FE-TOUR-ADD-002: each entry does its own thing and closes the menu', () => {
    const p = planner();
    const gpx = gpxImport();
    render(<TourAddMenu planner={p} gpxImport={gpx} onTakenOver={vi.fn()} disabled={false} />);
    open();
    fireEvent.click(screen.getByText('Plan new tour'));
    expect(p.startNewTour).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group')).toBeNull();
    open();
    fireEvent.click(screen.getByText('Import GPX or KML'));
    expect(gpx.pick).toHaveBeenCalledTimes(1);
    open();
    fireEvent.click(screen.getByText('Take over a tour from another trip'));
    expect(library.show).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-ADD-003: with no tour open the map is already planning one, so that entry is left out', () => {
    render(<TourAddMenu planner={planner('neutral')} gpxImport={gpxImport()} onTakenOver={vi.fn()} disabled={false} />);
    open();
    expect(entries().map((entry) => entry.textContent)).toEqual([
      'Import GPX or KML',
      'Import walk from Google Maps',
      'Take over a tour from another trip',
    ]);
  });

  it('FE-TOUR-ADD-004: a tour taken over comes in, and opens unless the editor holds unsaved work', async () => {
    const onTakenOver = vi.fn().mockResolvedValue(undefined);
    const p = planner();
    const { rerender } = render(<TourAddMenu planner={p} onTakenOver={onTakenOver} disabled={false} />);
    const take = (library.options as { onTakenOver: (tour: unknown) => Promise<void> }).onTakenOver;
    await take({ place_id: 9 });
    expect(onTakenOver).toHaveBeenCalledWith({ place_id: 9 });
    expect(p.openTour).toHaveBeenCalledWith({ place_id: 9 });

    const busy = planner('new-draft', { hasUnsavedChanges: true });
    rerender(<TourAddMenu planner={busy} onTakenOver={onTakenOver} disabled={false} />);
    await (library.options as { onTakenOver: (tour: unknown) => Promise<void> }).onTakenOver({ place_id: 10 });
    expect(busy.openTour).not.toHaveBeenCalled();
    expect(screen.getByTestId('library-dialog')).toBeInTheDocument();
  });

  it('FE-TOUR-ADD-005: waits while saving or importing, and offers a walk from Google Maps with nothing else to offer', () => {
    const { rerender } = render(<TourAddMenu planner={planner()} gpxImport={gpxImport(true)} disabled={false} />);
    expect(screen.getByTestId('tour-rail-add')).toBeDisabled();
    rerender(<TourAddMenu planner={planner()} gpxImport={gpxImport()} disabled />);
    expect(screen.getByTestId('tour-rail-add')).toBeDisabled();
    rerender(<TourAddMenu planner={planner('neutral')} disabled={false} />);
    open();
    expect(entries().map((entry) => entry.textContent)).toEqual(['Import walk from Google Maps']);
    expect(screen.queryByTestId('library-dialog')).toBeNull();
  });

  it('FE-TOUR-ADD-006: the walk entry opens its dialog, which knows about unsaved work in the planner (CW-07)', () => {
    const p = planner('new-draft', { hasUnsavedChanges: true });
    render(<TourAddMenu planner={p} gpxImport={gpxImport()} disabled={false} />);
    expect((walk.options as { planner: unknown }).planner).toBe(p);
    expect(screen.getByTestId('walk-dialog')).toHaveAttribute('data-unsaved', 'true');
    open();
    fireEvent.click(screen.getByText('Import walk from Google Maps'));
    expect(walk.show).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group')).toBeNull();
  });
});
