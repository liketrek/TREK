import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { retryable, statusLabelOf } from './railStatusText';
import { RailStatusBadges } from './TourRailStatus';
import type { TourPlannerController } from './useTourPlanner';

// The badges read only these fields of the planner, so a partial one stands in for the whole controller.
function plannerWith(fields: Partial<TourPlannerController>): TourPlannerController {
  return {
    isSaving: false,
    status: 'ready',
    error: null,
    draftRestored: false,
    hasUnsavedChanges: false,
    tourType: 'hike',
    paddleRoute: null,
    unreachable: null,
    retry: vi.fn(),
    ...fields,
  } as unknown as TourPlannerController;
}

const t = (key: string, params?: Record<string, string | number | null>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('retryable', () => {
  it('offers a retry after a failed route or elevation lookup', () => {
    expect(retryable(plannerWith({ status: 'routing-failed' }))).toBe(true);
    expect(retryable(plannerWith({ status: 'elevation-failed' }))).toBe(true);
    expect(retryable(plannerWith({ status: 'ready' }))).toBe(false);
  });

  it('offers none where asking again changes nothing', () => {
    for (const error of ['paddle-route', 'unreachable', 'walk-gap']) {
      expect(retryable(plannerWith({ status: 'routing-failed', error }))).toBe(false);
    }
  });
});

describe('statusLabelOf', () => {
  it('puts a refused or failed save before what the editor is doing', () => {
    expect(statusLabelOf(plannerWith({ error: 'conflict' }), 'tours.planner.status.dirty', t)).toBe(
      'tours.revision.conflictTitle'
    );
    expect(statusLabelOf(plannerWith({ error: 'save' }), undefined, t)).toBe('tours.planner.status.saveFailed');
  });

  it('says nothing without a status, and the generic routing words for a ride', () => {
    expect(statusLabelOf(plannerWith({}), undefined, t)).toBeNull();
    expect(statusLabelOf(plannerWith({ tourType: 'bike' }), 'tours.planner.status.routing', t)).toBe(
      'tours.planner.status.routingGeneric'
    );
    expect(statusLabelOf(plannerWith({ tourType: 'hike' }), 'tours.planner.status.routing', t)).toBe(
      'tours.planner.status.routing'
    );
  });

  it('counts the paddle legs the router could not plan', () => {
    const planner = plannerWith({
      error: 'paddle-route',
      paddleRoute: { failures: [{}, {}] } as unknown as TourPlannerController['paddleRoute'],
    });
    expect(statusLabelOf(planner, 'tours.planner.status.dirty', t)).toBe('tours.paddle.status.unrouted:{"count":2}');
  });
});

describe('RailStatusBadges', () => {
  it('renders nothing while there is nothing to say', () => {
    render(<RailStatusBadges planner={plannerWith({})} />);
    expect(screen.queryByTestId('tour-planner-status')).toBeNull();
  });

  it('shows a failed route with its retry button', () => {
    const retry = vi.fn();
    render(<RailStatusBadges planner={plannerWith({ status: 'routing-failed', retry })} />);
    expect(screen.getByTestId('tour-planner-status')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
