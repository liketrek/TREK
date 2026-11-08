import { fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MTourWorkspace from '../../../../src/mobile/screens/trip/tours/MTourWorkspace';
import { buildPlanner } from '../../../helpers/mobileTrip';
import { render, screen } from '../../../helpers/render';
import { setSizeClass } from '../../../helpers/sizeClass';

// FE-MOB-TOURWS-001 onwards: the tours tab on an iPad or an unfolded foldable, the
// desktop's tour editor over the shell's planner.

const page = vi.hoisted(() => ({
  mode: { type: 'neutral' } as { type: string },
  wandererOpen: false,
  calls: [] as unknown[],
}));
const dragBridge = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/pages/tripPlanner/useTripPlannerPage', () => ({
  useTripPlannerPageOf: (planner: unknown) => {
    page.calls.push(planner);
    return {
      tourPlanner: { mode: page.mode },
      wandererBrowser: { open: page.wandererOpen, onViewportChange: vi.fn() },
      tourGpxImport: {},
      tourMap: {},
      locationSearch: {},
      tourDetailActions: { onTakenOver: vi.fn() },
      viewImportedTour: vi.fn(),
      paddleChecklist: undefined,
      permissions: { canPlaceEdit: true, canDayEdit: true },
    };
  },
}));
vi.mock('../../../../src/pages/tripPlanner/TourPlannerMapStage', () => ({
  TourPlannerMapStage: (props: { leftPanelPx: number; rightPanelPx: number; leftHidden: boolean }) => (
    <div
      data-testid="tour-map"
      data-left={props.leftPanelPx}
      data-right={props.rightPanelPx}
      data-hidden={String(props.leftHidden)}
    />
  ),
}));
vi.mock('../../../../src/components/Tours/TourWorkspaceRail', () => ({
  default: () => <div data-testid="tour-editor" />,
}));
vi.mock('../../../../src/components/Tours/planner/TourPlannerPanels', () => ({
  TourPlannerToursRail: () => <div data-testid="tour-list" />,
}));
vi.mock('../../../../src/components/Tours/TourGpxDropZone', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="gpx-drop">{children}</div>,
}));
vi.mock('../../../../src/hooks/useTouchDragBridge', () => ({ useTouchDragBridge: dragBridge }));

beforeEach(() => {
  page.mode = { type: 'neutral' };
  page.wandererOpen = false;
  page.calls = [];
  dragBridge.mockClear();
});

describe('MTourWorkspace', () => {
  it('FE-MOB-TOURWS-001: split puts the trip tours beside the map, with nothing to switch between them', async () => {
    setSizeClass('split');
    const planner = buildPlanner();
    render(<MTourWorkspace planner={planner} />);
    expect(await screen.findByTestId('tour-list')).toBeInTheDocument();
    expect(screen.getByTestId('tour-map')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'mobileTrip.mapView' })).not.toBeInTheDocument();
    // The page state is built over the shell's own planner, never a second one.
    expect(page.calls.length).toBeGreaterThan(0);
    expect(page.calls.every((seen) => seen === planner)).toBe(true);
    // The map has the stage to itself: no desktop panel covers any of it.
    const map = screen.getByTestId('tour-map');
    expect(map.dataset.left).toBe('0');
    expect(map.dataset.right).toBe('0');
    expect(map.dataset.hidden).toBe('false');
    // A finger can start the waypoint list's drag.
    expect(dragBridge).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-TOURWS-002: wide shows the pane or the map, and switches between them', async () => {
    setSizeClass('wide');
    render(<MTourWorkspace planner={buildPlanner()} />);
    expect(await screen.findByTestId('tour-list')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-map')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.mapView' }));
    expect(screen.getByTestId('tour-map')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-list')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mobileTrip.listView' }));
    expect(await screen.findByTestId('tour-list')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-map')).not.toBeInTheDocument();
  });

  it('FE-MOB-TOURWS-003: the pane has the trip tours and the editor as its two halves', async () => {
    setSizeClass('split');
    render(<MTourWorkspace planner={buildPlanner()} />);
    expect(screen.getByRole('tab', { name: 'tours.planner.tripTours' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'tours.planner.title' }));
    expect(await screen.findByTestId('tour-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-list')).not.toBeInTheDocument();
  });

  it('FE-MOB-TOURWS-004: a tour opened in the editor turns the pane to it, headed with what is open', async () => {
    setSizeClass('split');
    page.mode = { type: 'edit-saved' };
    render(<MTourWorkspace planner={buildPlanner()} />);
    expect(await screen.findByTestId('tour-editor')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'tours.planner.editTitle' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-TOURWS-007: closing the tour in the editor brings the trip tours back', async () => {
    setSizeClass('split');
    page.mode = { type: 'edit-saved' };
    const planner = buildPlanner();
    const { rerender } = render(<MTourWorkspace planner={planner} />);
    expect(await screen.findByTestId('tour-editor')).toBeInTheDocument();
    page.mode = { type: 'neutral' };
    rerender(<MTourWorkspace planner={planner} />);
    expect(await screen.findByTestId('tour-list')).toBeInTheDocument();
  });

  it('FE-MOB-TOURWS-005: browsing the wanderer trails is shown in the editor half too', async () => {
    setSizeClass('wide');
    page.wandererOpen = true;
    render(<MTourWorkspace planner={buildPlanner()} />);
    expect(await screen.findByTestId('tour-editor')).toBeInTheDocument();
  });

  it('FE-MOB-TOURWS-006: the GPX drop zone wraps the tab, so its preview dialog is there for an import', () => {
    setSizeClass('split');
    render(<MTourWorkspace planner={buildPlanner()} />);
    expect(screen.getByTestId('gpx-drop')).toContainElement(screen.getByTestId('tour-map'));
  });
});
