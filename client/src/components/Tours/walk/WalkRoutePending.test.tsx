import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import { WalkRoutePendingHint, WalkRoutePendingNotice } from './WalkRoutePending';

// FE-WALK-ROUTE-PENDING-001 to FE-WALK-ROUTE-PENDING-002: a walk an assistant saved with its stops only (CW-11).

describe('WalkRoutePending (CW-11)', () => {
  it('FE-WALK-ROUTE-PENDING-001: the planner says the way was just planned until the walk is saved with it', () => {
    const { rerender } = render(
      <WalkRoutePendingNotice planner={{ routePending: true, hasUnsavedChanges: true, status: 'ready' }} />
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved with its stops only. The way between them was planned just now; save the walk to keep it.'
    );
    // Saved, or open for someone who may not save it: nothing to say.
    rerender(<WalkRoutePendingNotice planner={{ routePending: true, hasUnsavedChanges: false, status: 'ready' }} />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<WalkRoutePendingNotice planner={{ routePending: false, hasUnsavedChanges: true, status: 'ready' }} />);
    expect(screen.queryByRole('status')).toBeNull();
    // Still being planned, or planning it failed: nothing was planned yet.
    rerender(<WalkRoutePendingNotice planner={{ routePending: true, hasUnsavedChanges: true, status: 'routing' }} />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(
      <WalkRoutePendingNotice planner={{ routePending: true, hasUnsavedChanges: true, status: 'routing-failed' }} />
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('FE-WALK-ROUTE-PENDING-002: the detail says where the way gets planned', () => {
    render(<WalkRoutePendingHint />);
    expect(
      screen.getByText(
        'Saved with its stops only. The way between them is planned when the walk is opened in the planner and saved.'
      )
    ).toBeInTheDocument();
  });
});
