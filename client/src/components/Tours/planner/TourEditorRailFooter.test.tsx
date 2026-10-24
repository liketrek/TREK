import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { TourEditorRailFooter } from './TourEditorRailFooter';
import type { TourPlannerController } from './useTourPlanner';

// The footer reads only these fields of the planner, so a partial one stands in for the whole controller.
function plannerWith(fields: Partial<TourPlannerController>): TourPlannerController {
  return {
    isSaving: false,
    isPaddle: false,
    hasUnsavedChanges: true,
    canSave: true,
    save: vi.fn(() => Promise.resolve()),
    ...fields,
  } as unknown as TourPlannerController;
}

function renderFooter(
  planner: TourPlannerController,
  props: { canEdit?: boolean; locked?: boolean; isSavedEdit?: boolean } = {}
) {
  const onDiscard = vi.fn();
  render(
    <TourEditorRailFooter
      planner={planner}
      canEdit={props.canEdit ?? true}
      locked={props.locked ?? false}
      isSavedEdit={props.isSavedEdit ?? false}
      onDiscard={onDiscard}
    />
  );
  return { onDiscard };
}

describe('TourEditorRailFooter', () => {
  it('saves and discards an edited draft', () => {
    const planner = plannerWith({});
    const { onDiscard } = renderFooter(planner);
    fireEvent.click(screen.getByRole('button', { name: /common\.save|save/i }));
    fireEvent.click(screen.getByRole('button', { name: /common\.discard|discard/i }));
    expect(planner.save).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('says a saved tour without changes has nothing to save, and keeps the way out open', () => {
    renderFooter(plannerWith({ hasUnsavedChanges: false, canSave: false }), { isSavedEdit: true });
    expect(screen.getByTestId('tour-planner-nothing-to-save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /common\.discard|discard/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /common\.save|save/i })).toBeDisabled();
  });

  it('offers no discard on a new draft without changes', () => {
    renderFooter(plannerWith({ hasUnsavedChanges: false }));
    expect(screen.queryByTestId('tour-planner-nothing-to-save')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /common\.discard|discard/i })).toBeDisabled();
  });

  it('does not save while the viewer may not edit', () => {
    const planner = plannerWith({});
    renderFooter(planner, { canEdit: false, locked: true, isSavedEdit: true });
    expect(screen.queryByTestId('tour-planner-nothing-to-save')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /common\.save|save/i })).toBeDisabled();
  });
});
