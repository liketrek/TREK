import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TourRemoteChangeNotice, TourRevisionConflictDialog } from './TourRevisionNotice';
import type { TourPlannerController } from './useTourPlanner';
import { revisionConflictOf, useTourRevisionGuard } from './useTourRevisionGuard';
import { useTourRevisionWatch } from './useTourRevisionWatch';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

function refused(status: number, data: unknown) {
  const headers = new AxiosHeaders();
  return new AxiosError('refused', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers,
    config: { headers },
    data,
  });
}

const CONFLICT = refused(409, {
  error: 'This tour was changed in the meantime',
  code: 'tour_revision_conflict',
  revision: 5,
});

beforeEach(() => vi.clearAllMocks());

describe('revisionConflictOf (P2C-03)', () => {
  it('reads the revision off a refused save, and nothing off anything else', () => {
    expect(revisionConflictOf(CONFLICT)).toBe(5);
    expect(revisionConflictOf(refused(409, { error: 'conflict', server: {} }))).toBeNull();
    expect(revisionConflictOf(refused(500, { code: 'tour_revision_conflict', revision: 5 }))).toBeNull();
    expect(revisionConflictOf(refused(409, { code: 'tour_revision_conflict', revision: 'x' }))).toBeNull();
    expect(revisionConflictOf(new Error('offline'))).toBeNull();
  });
});

describe('useTourRevisionGuard (P2C-03)', () => {
  it('keeps the base a save names, and hears of a newer revision only once one is known', () => {
    const { result } = renderHook(() => useTourRevisionGuard());
    expect(result.current.notice(4)).toBe(false);
    act(() => result.current.adopt(3));
    expect(result.current.base).toBe(3);
    expect(result.current.baseRef.current).toBe(3);
    let noticed = false;
    act(() => {
      noticed = result.current.notice(3);
    });
    expect(noticed).toBe(false);
    act(() => {
      noticed = result.current.notice(4);
    });
    expect(noticed).toBe(true);
    expect(result.current.remote).toBe(4);
    act(() => result.current.dismissRemote());
    expect(result.current.remote).toBeNull();
  });

  it('turns a refused save into a conflict, and taking it over makes the next save name the newer revision', () => {
    const { result } = renderHook(() => useTourRevisionGuard(3));
    let refusedForRevision = false;
    act(() => {
      refusedForRevision = result.current.refuse(new Error('network'));
    });
    expect(refusedForRevision).toBe(false);
    act(() => {
      refusedForRevision = result.current.refuse(CONFLICT);
    });
    expect(refusedForRevision).toBe(true);
    expect(result.current.conflict).toEqual({ revision: 5 });
    act(() => result.current.takeOver());
    expect(result.current.conflict).toBeNull();
    expect(result.current.baseRef.current).toBe(5);
  });

  it('forgets the base and what it knew of others when the planner moves on', () => {
    const { result } = renderHook(() => useTourRevisionGuard(3));
    act(() => {
      result.current.refuse(CONFLICT);
    });
    act(() => result.current.adopt(null));
    expect(result.current.base).toBeNull();
    expect(result.current.conflict).toBeNull();
    act(() => result.current.dismissConflict());
    act(() => result.current.takeOver());
    expect(result.current.base).toBeNull();
  });
});

function plannerWith(
  overrides: Omit<Partial<TourPlannerController>, 'revision'> & {
    revision?: Partial<TourPlannerController['revision']>;
  } = {}
) {
  const revision = {
    base: 3,
    baseRef: { current: 3 },
    conflict: null,
    remote: null,
    adopt: vi.fn(),
    notice: vi.fn(() => false),
    refuse: vi.fn(),
    takeOver: vi.fn(),
    dismissConflict: vi.fn(),
    dismissRemote: vi.fn(),
    ...overrides.revision,
  };
  return {
    mode: { type: 'edit-saved', placeId: 7 },
    name: 'Kramer',
    hasUnsavedChanges: true,
    isSaving: false,
    openTour: vi.fn(async () => true),
    save: vi.fn(async () => null),
    ...overrides,
    revision,
  } as unknown as TourPlannerController;
}

describe('TourRemoteChangeNotice (P2C-03)', () => {
  it('says so while the draft has changes of its own, and loads the newer tour only after a confirm', () => {
    const planner = plannerWith({ revision: { remote: 4 } });
    render(<TourRemoteChangeNotice planner={planner} />);
    expect(screen.getByTestId('tour-remote-change')).toHaveTextContent('tours.revision.remoteTitle');
    fireEvent.click(screen.getByRole('button', { name: /tours.revision.loadNewer/ }));
    expect(planner.openTour).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'tours.revision.loadNewer' })[1]);
    expect(planner.openTour).toHaveBeenCalledWith({ place_id: 7 });
  });

  it('stays away without news, without changes, or while a conflict asks instead; closing dismisses it', () => {
    const { rerender } = render(<TourRemoteChangeNotice planner={plannerWith()} />);
    expect(screen.queryByTestId('tour-remote-change')).toBeNull();
    rerender(<TourRemoteChangeNotice planner={plannerWith({ hasUnsavedChanges: false, revision: { remote: 4 } })} />);
    expect(screen.queryByTestId('tour-remote-change')).toBeNull();
    rerender(<TourRemoteChangeNotice planner={plannerWith({ revision: { remote: 4, conflict: { revision: 4 } } })} />);
    expect(screen.queryByTestId('tour-remote-change')).toBeNull();
    const planner = plannerWith({ revision: { remote: 4 } });
    rerender(<TourRemoteChangeNotice planner={planner} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    expect(planner.revision.dismissRemote).toHaveBeenCalled();
  });
});

describe('TourRevisionConflictDialog (P2C-03)', () => {
  it('offers three ways on: save as a tour of its own, load the newer one, or overwrite on purpose', () => {
    const planner = plannerWith({ revision: { conflict: { revision: 5 } } });
    render(<TourRevisionConflictDialog planner={planner} />);
    fireEvent.click(screen.getByTestId('tour-conflict-save-new'));
    expect(planner.save).toHaveBeenCalledWith({ asNew: true, name: 'tours.revision.mineName' });
    fireEvent.click(screen.getByTestId('tour-conflict-reload'));
    expect(planner.openTour).toHaveBeenCalledWith({ place_id: 7 });
    fireEvent.click(screen.getByTestId('tour-conflict-overwrite'));
    expect(planner.revision.takeOver).toHaveBeenCalled();
    expect(planner.save).toHaveBeenLastCalledWith();
  });

  it('is not there without a conflict, or once the tour is no longer the one in the editor', () => {
    const { rerender } = render(<TourRevisionConflictDialog planner={plannerWith()} />);
    expect(screen.queryByTestId('tour-conflict-reload')).toBeNull();
    rerender(
      <TourRevisionConflictDialog
        planner={plannerWith({ mode: { type: 'new-draft' }, revision: { conflict: { revision: 5 } } })}
      />
    );
    expect(screen.queryByTestId('tour-conflict-reload')).toBeNull();
  });
});

describe('useTourRevisionWatch (P2C-03)', () => {
  const listed = (revision: number) => [{ place_id: 7, revision } as TourListItem];

  it('loads a newer revision at once while the editor has no changes, and says so', async () => {
    const planner = plannerWith({ hasUnsavedChanges: false, revision: { notice: vi.fn(() => true) } });
    renderHook(() => useTourRevisionWatch(planner, listed(4)));
    await act(async () => undefined);
    expect(planner.revision.notice).toHaveBeenCalledWith(4);
    expect(planner.openTour).toHaveBeenCalledWith({ place_id: 7 });
    expect(toast.info).toHaveBeenCalledWith('tours.revision.reloaded');
  });

  it('keeps an editor with changes as it is, and asks nothing of one that is saving or shows no saved tour', async () => {
    const editing = plannerWith({ revision: { notice: vi.fn(() => true) } });
    renderHook(() => useTourRevisionWatch(editing, listed(4)));
    const saving = plannerWith({ hasUnsavedChanges: false, isSaving: true, revision: { notice: vi.fn(() => true) } });
    renderHook(() => useTourRevisionWatch(saving, listed(4)));
    const drafting = plannerWith({ mode: { type: 'new-draft' }, revision: { notice: vi.fn(() => true) } });
    renderHook(() => useTourRevisionWatch(drafting, listed(4)));
    await act(async () => undefined);
    expect(editing.revision.notice).toHaveBeenCalledWith(4);
    expect(saving.revision.notice).not.toHaveBeenCalled();
    expect(drafting.revision.notice).not.toHaveBeenCalled();
    for (const planner of [editing, saving, drafting]) expect(planner.openTour).not.toHaveBeenCalled();
  });
});
