// FE-PADDLE-WAYPOINT-PARTS-001 to 004: the pending portage at the last point and a portage's way on land (PAD-03).
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { PendingPortageRow, PortageLegRow, type PortageWay } from './PaddleWaypointParts';

const way = (extra: Partial<PortageWay> = {}): PortageWay => ({
  routed: false,
  noWay: false,
  searching: false,
  onFollow: vi.fn(),
  onStraighten: vi.fn(),
  ...extra,
});

function openPortage(props: Partial<Parameters<typeof PortageLegRow>[0]> = {}) {
  render(<PortageLegRow lengthM={320} extraMinutes={null} disabled={false} onExtraChange={vi.fn()} {...props} />);
  fireEvent.click(screen.getByRole('button', { expanded: false }));
}

describe('PendingPortageRow', () => {
  it('FE-PADDLE-WAYPOINT-PARTS-001: says to set the point where the boat goes in again, and takes the ask back', () => {
    const onRemove = vi.fn();
    render(<PendingPortageRow disabled={false} onRemove={onRemove} />);
    expect(screen.getByTestId('tour-planner-portage-pending')).toHaveTextContent('Portage from here');
    fireEvent.click(screen.getByRole('button', { name: 'Do not carry after all' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-WAYPOINT-PARTS-002: offers no way back on a tour that cannot be edited', () => {
    render(<PendingPortageRow disabled onRemove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Do not carry after all' })).toBeNull();
  });
});

describe('PortageLegRow way', () => {
  it('FE-PADDLE-WAYPOINT-PARTS-003: switches between following the path and a straight line', () => {
    const straight = way();
    openPortage({ way: straight });
    fireEvent.click(screen.getByRole('button', { name: 'Follow the path' }));
    expect(straight.onFollow).toHaveBeenCalledTimes(1);
    const routed = way({ routed: true });
    openPortage({ way: routed });
    fireEvent.click(screen.getAllByRole('button', { name: 'Straight line' })[1]);
    expect(routed.onStraighten).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-WAYPOINT-PARTS-004: says why a carry stayed straight, and that the router is asked', () => {
    openPortage({ way: way({ noWay: true }) });
    expect(screen.getByTestId('tour-planner-portage-way')).toHaveTextContent('No path without a long detour');
    openPortage({ way: way({ searching: true }) });
    expect(screen.getAllByTestId('tour-planner-portage-way')[1]).toHaveTextContent('Looking for a path');
  });
});
